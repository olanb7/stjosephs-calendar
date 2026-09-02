import { DateTime } from 'luxon';

export function parseSchoolDateTime(date: string, time: string | undefined, timezone: string): Date {
  const normalizedDate = date.replace(/\s+/g, '-').replace(/-{2,}/g, '-').trim();
  const normalizedTime = time?.trim();

  const format = normalizedTime ? 'dd-MMM-yy HH:mm' : 'dd-MMM-yy';
  const value = normalizedTime ? `${normalizedDate} ${normalizedTime}` : normalizedDate;
  const parsedWithGbLocale = DateTime.fromFormat(value, format, {
    locale: 'en-GB',
    zone: timezone,
  });
  const parsed = parsedWithGbLocale.isValid
    ? parsedWithGbLocale
    : DateTime.fromFormat(value, format, {
        locale: 'en',
        zone: timezone,
      });

  if (!parsed?.isValid) {
    throw new Error(`Unable to parse date/time "${value}" in timezone "${timezone}"`);
  }

  return parsed.toJSDate();
}
