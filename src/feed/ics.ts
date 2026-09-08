import ical, { ICalCalendarMethod } from 'ical-generator';

import type { AppConfig, CalendarEvent } from '../types.js';
import { normalizeIcsLineEndings, validateIcsContentLines } from './validation.js';

function stripUnsafeIcsControlCharacters(value: string): string {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0);

    if (codePoint === undefined) {
      return '';
    }

    const isUnsafeControlCharacter =
      codePoint === 0x7f || (codePoint < 0x20 && codePoint !== 0x09 && codePoint !== 0x0a && codePoint !== 0x0d);

    return isUnsafeControlCharacter ? ' ' : character;
  }).join('');
}

function sanitizeIcsText(value: string | undefined): string | undefined {
  const sanitized = value
    ? stripUnsafeIcsControlCharacters(value).replace(/\r\n?/g, ' ').replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
    : undefined;

  return sanitized ? sanitized : undefined;
}

function joinDescriptionLines(...values: Array<string | undefined>): string | undefined {
  const lines = values.map((value) => sanitizeIcsText(value)).filter((value): value is string => Boolean(value));
  return lines.length > 0 ? lines.join('\n\n') : undefined;
}

export function buildIcs(events: CalendarEvent[], config: AppConfig): string {
  const calendar = ical({
    name: sanitizeIcsText(config.feedName) ?? config.feedName,
    prodId: {
      company: 'olanb7',
      product: 'stjosephspta-calendar',
    },
    timezone: config.calendarTimezone,
  });

  calendar.method(ICalCalendarMethod.PUBLISH);
  calendar.x([
    ['X-WR-CALNAME', sanitizeIcsText(config.feedName) ?? config.feedName],
    ['X-WR-TIMEZONE', sanitizeIcsText(config.calendarTimezone) ?? config.calendarTimezone],
  ]);

  for (const event of events) {
    calendar.createEvent({
      ...(joinDescriptionLines(event.description, event.url ? `More info: ${event.url}` : undefined)
        ? { description: joinDescriptionLines(event.description, event.url ? `More info: ${event.url}` : undefined) }
        : {}),
      ...(event.end ? { end: event.end } : {}),
      id: event.uid,
      start: event.start,
      summary: sanitizeIcsText(event.title) ?? event.title,
      timezone: sanitizeIcsText(event.timezone) ?? event.timezone,
      ...(sanitizeIcsText(event.url) ? { url: sanitizeIcsText(event.url) } : {}),
    });
  }

  const ics = normalizeIcsLineEndings(calendar.toString());
  validateIcsContentLines(ics);

  return ics;
}
