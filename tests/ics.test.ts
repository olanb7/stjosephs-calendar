import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';
import { buildIcs } from '../src/feed/ics.js';

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
  });
});
