import { parseSchoolDateTime } from '../date-time.js';
import { buildIcs } from '../feed/ics.js';
import { stableHash } from '../hash.js';
import { createPublisher } from '../publish/file.js';
import { AspNetCalendarClient } from '../source/aspnet.js';
import { parseEventDetails, parseMonthView } from '../source/parsers.js';
import type { AppConfig, CalendarEvent, MonthView, RawCalendarEvent } from '../types.js';

function buildDescription(event: RawCalendarEvent): string | undefined {
  const parts = [event.description, event.moreInfo].filter((value): value is string => Boolean(value && value.trim()));
  return parts.length > 0 ? parts.join('\n\n') : undefined;
}

function normalizeEvent(rawEvent: RawCalendarEvent, config: AppConfig): CalendarEvent {
  const start = parseSchoolDateTime(rawEvent.startDate, rawEvent.startTime, config.calendarTimezone);
  const end = rawEvent.endDate
    ? parseSchoolDateTime(rawEvent.endDate, rawEvent.endTime, config.calendarTimezone)
    : undefined;
  const identity = [
    rawEvent.title,
    rawEvent.startDate,
    rawEvent.startTime ?? '',
    rawEvent.endDate ?? '',
    rawEvent.endTime ?? '',
    rawEvent.moreInfoUrl ?? '',
  ].join('|');

  return {
    ...(buildDescription(rawEvent) ? { description: buildDescription(rawEvent) } : {}),
    ...(end ? { end } : {}),
    start,
    timezone: config.calendarTimezone,
    title: rawEvent.title,
    uid: `stjosephsps-${stableHash(identity)}@olanb7`,
    url: rawEvent.moreInfoUrl || config.calendarBaseUrl,
  };
}

function mergeEvents(existing: CalendarEvent | undefined, incoming: CalendarEvent): CalendarEvent {
  if (!existing) {
    return incoming;
  }

  return {
    ...incoming,
    ...(existing.description ?? incoming.description
      ? { description: existing.description ?? incoming.description }
      : {}),
    ...(existing.end ?? incoming.end ? { end: existing.end ?? incoming.end } : {}),
    ...(existing.url ?? incoming.url ? { url: existing.url ?? incoming.url } : {}),
  };
}

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((left, right) => {
    const startDiff = left.start.getTime() - right.start.getTime();
    if (startDiff !== 0) {
      return startDiff;
    }

    return left.title.localeCompare(right.title, 'en-GB');
  });
}

async function collectMonthEvents(client: AspNetCalendarClient, monthPage: { page: { html: string; hiddenFields: Record<string, string> }; view: MonthView }): Promise<RawCalendarEvent[]> {
  const rawEvents: RawCalendarEvent[] = [];

  for (const eventLink of monthPage.view.eventLinks) {
    const detailPage = await client.postBack(monthPage.page, eventLink.target);
    const detailEvents = parseEventDetails(detailPage.html, {
      sourceMonth: monthPage.view.monthLabel,
      sourceTarget: eventLink.target,
    });
    rawEvents.push(...detailEvents);
  }

  return rawEvents;
}

export async function scrapeCalendarEvents(config: AppConfig): Promise<CalendarEvent[]> {
  const client = new AspNetCalendarClient(
    config.calendarBaseUrl,
    config.calendarUserAgent,
    config.allowInsecureTls,
  );
  const dedupedEvents = new Map<string, CalendarEvent>();
  let currentPage = await client.loadInitialPage();

  for (let monthIndex = 0; monthIndex < config.calendarMonthsToFetch; monthIndex += 1) {
    const view = parseMonthView(currentPage.html);
    const monthEvents = await collectMonthEvents(client, { page: currentPage, view });

    for (const rawEvent of monthEvents) {
      const normalized = normalizeEvent(rawEvent, config);
      dedupedEvents.set(normalized.uid, mergeEvents(dedupedEvents.get(normalized.uid), normalized));
    }

    if (monthIndex === config.calendarMonthsToFetch - 1 || !view.nextMonthTarget) {
      break;
    }

    currentPage = await client.postBack(currentPage, view.nextMonthTarget);
  }

  return sortEvents([...dedupedEvents.values()]);
}

export async function runCalendarPublication(config: AppConfig): Promise<{
  destination: string;
  eventCount: number;
}> {
  const events = await scrapeCalendarEvents(config);
  const ics = buildIcs(events, config);
  const publisher = createPublisher(config);
  const published = await publisher.publish(ics);

  return {
    destination: published.destination,
    eventCount: events.length,
  };
}
