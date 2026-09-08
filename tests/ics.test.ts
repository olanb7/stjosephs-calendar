import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';
import { buildIcs } from '../src/feed/ics.js';
import { validateIcsContentLines } from '../src/feed/validation.js';

describe('ICS generation', () => {
  it('renders a publishable calendar feed', () => {
    const config = loadConfig({
      CALENDAR_BASE_URL: 'https://www.stjosephsps.co.uk/Calendar',
      PUBLIC_FEED_BASE_URL: 'https://example.com/calendar/stjosephsps.ics',
    });

    const ics = buildIcs(
      [
        {
          description: 'School closed for the bank holiday.',
          end: new Date('2026-05-05T14:00:00.000Z'),
          start: new Date('2026-05-04T08:00:00.000Z'),
          timezone: 'Europe/London',
          title: 'Early May Bank Holidays (School Closed)',
          uid: 'stjosephsps-test@olanb7',
          url: 'https://www.stjosephsps.co.uk/Calendar',
        },
      ],
      config,
    );

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('METHOD:PUBLISH');
    expect(ics).toContain("X-WR-CALNAME:St Joseph's Primary School Calendar");
    expect(ics).toContain('SUMMARY:Early May Bank Holidays (School Closed)');
    expect(ics).toContain('UID:stjosephsps-test@olanb7');
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics).not.toMatch(/(^|[^\r])\n/);
  });

  it('sanitizes user-entered values and validates folded lines', () => {
    const config = loadConfig({
      CALENDAR_BASE_URL: 'https://www.stjosephsps.co.uk/Calendar',
      PUBLIC_FEED_BASE_URL: 'https://example.com/calendar/stjosephsps.ics',
    });

    const ics = buildIcs(
      [
        {
          description: 'Bring cakes\r\nand prizes\u0007',
          end: new Date('2026-07-10T20:00:00.000Z'),
          start: new Date('2026-07-10T17:30:00.000Z'),
          timezone: 'Europe/London',
          title: 'Summer Fair\r\nParents Evening',
          uid: 'stjosephsps-folded-test@olanb7',
          url: `https://www.stjosephsps.co.uk/Calendar/EventDetails?id=${'9'.repeat(160)}`,
        },
      ],
      config,
    );

    expect(ics).toContain('SUMMARY:Summer Fair Parents Evening');
    expect(ics).toContain('DESCRIPTION:Bring cakes and prizes');
    expect(ics.split('\r\n').some((line) => line.startsWith(' '))).toBe(true);
    expect(() => validateIcsContentLines(ics)).not.toThrow();
  });

  it('rejects LF-delimited ICS content', () => {
    expect(() => validateIcsContentLines('BEGIN:VCALENDAR\nEND:VCALENDAR\n')).toThrow(/CRLF/);
  });
});
