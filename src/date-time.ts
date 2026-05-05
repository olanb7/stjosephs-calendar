import { DateTime } from 'luxon';

export function parseSchoolDateTime(date: string, time: string | undefined, timezone: string): Date {
  const format = time ? 'dd-MMM-yy HH:mm' : 'dd-MMM-yy';
  const value = time ? `${date} ${time}` : date;
  const parsed = DateTime.fromFormat(value, format, {
    locale: 'en-GB',
    zone: timezone,
  });

  if (!parsed.isValid) {
    throw new Error(`Unable to parse date/time "${value}" in timezone "${timezone}"`);
  }

  return parsed.toJSDate();
}
