import ical, { ICalCalendarMethod } from 'ical-generator';

import type { AppConfig, CalendarEvent } from '../types.js';

function joinDescriptionLines(...values: Array<string | undefined>): string | undefined {
  const lines = values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
  return lines.length > 0 ? lines.join('\n\n') : undefined;
}

export function buildIcs(events: CalendarEvent[], config: AppConfig): string {
  const calendar = ical({
    name: config.feedName,
    prodId: {
      company: 'olanb7',
      product: 'stjosephspta-calendar',
    },
    timezone: config.calendarTimezone,
  });

  calendar.method(ICalCalendarMethod.PUBLISH);
  calendar.x([
    ['X-WR-CALNAME', config.feedName],
    ['X-WR-TIMEZONE', config.calendarTimezone],
  ]);

  for (const event of events) {
    calendar.createEvent({
      ...(joinDescriptionLines(event.description, event.url ? `More info: ${event.url}` : undefined)
        ? { description: joinDescriptionLines(event.description, event.url ? `More info: ${event.url}` : undefined) }
        : {}),
      ...(event.end ? { end: event.end } : {}),
      id: event.uid,
      start: event.start,
      summary: event.title,
      timezone: event.timezone,
      ...(event.url ? { url: event.url } : {}),
    });
  }

  return calendar.toString();
}
