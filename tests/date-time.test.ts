import { describe, expect, it } from 'vitest';

import { parseSchoolDateTime } from '../src/date-time.js';

describe('parseSchoolDateTime', () => {
  it('parses a date using en-GB month abbreviations', () => {
    const parsed = parseSchoolDateTime('04-May-26', '09:00', 'Europe/London');

    expect(parsed.toISOString()).toBe('2026-05-04T08:00:00.000Z');
  });

  it('parses September dates using Sep abbreviation', () => {
    const parsed = parseSchoolDateTime('10-Sep-26', '09:30', 'Europe/London');

    expect(parsed.toISOString()).toBe('2026-09-10T08:30:00.000Z');
  });

  it('throws when a date cannot be parsed', () => {
    expect(() => parseSchoolDateTime('10-Invalid-26', '09:30', 'Europe/London')).toThrow(
      'Unable to parse date/time',
    );
  });
});
