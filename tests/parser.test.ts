import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';
import { scrapeCalendarEvents } from '../src/app/sync.js';
import { parseEventDetails, parseMonthView } from '../src/source/parsers.js';

const fixturesDir = join(process.cwd(), 'tests', 'fixtures');

describe('calendar parsers', () => {
  it('extracts month navigation and event links', async () => {
    const html = await readFile(join(fixturesDir, 'month.html'), 'utf8');
    const monthView = parseMonthView(html);

    expect(monthView.monthLabel).toBe('May 2026');
    expect(monthView.nextMonthTarget).toBe('ctl00$MainContent$ctlCalendar$repCalendar$ctl00$lnkNextMonth');
    expect(monthView.eventLinks).toEqual([
      {
        dayLabel: '4',
        target: 'ctl00$MainContent$ctlCalendar$repCalendar$ctl08$ctl00',
        title: 'Early May Bank Holidays (School Closed)',
      },
      {
        dayLabel: '16',
        target: 'ctl00$MainContent$ctlCalendar$repCalendar$ctl20$ctl00',
        title: 'First Holy Communion',
      },
    ]);
  });

  it('extracts event detail fields', async () => {
    const html = await readFile(join(fixturesDir, 'detail.html'), 'utf8');
    const details = parseEventDetails(html, {
      sourceMonth: 'May 2026',
      sourceTarget: 'ctl00$MainContent$ctlCalendar$repCalendar$ctl08$ctl00',
    });

    expect(details).toEqual([
      {
        description: 'School closed for the bank holiday.',
        endDate: '05-May-26',
        endTime: '15:00',
        moreInfo: 'See the term calendar.',
        moreInfoUrl: 'https://www.stjosephsps.co.uk/Calendar',
        sourceMonth: 'May 2026',
        sourceTarget: 'ctl00$MainContent$ctlCalendar$repCalendar$ctl08$ctl00',
        startDate: '04-May-26',
        startTime: '09:00',
        title: 'Early May Bank Holidays (School Closed)',
      },
    ]);
  });

  it('deduplicates repeated multi-day events during scraping', async () => {
    const monthHtml = await readFile(join(fixturesDir, 'month.html'), 'utf8');
    const detailHtml = await readFile(join(fixturesDir, 'detail.html'), 'utf8');

    const loadInitialPage = async () => ({
      hiddenFields: {
        __EVENTVALIDATION: 'token',
        __VIEWSTATE: 'token',
      },
      html: monthHtml,
    });

    const postBack = async (_: unknown, target: string) => {
      if (target.endsWith('lnkNextMonth')) {
        return {
          hiddenFields: {
            __EVENTVALIDATION: 'token-2',
            __VIEWSTATE: 'token-2',
          },
          html: monthHtml.replace('May 2026', 'Jun 2026'),
        };
      }

      return {
        hiddenFields: {
          __EVENTVALIDATION: 'detail-token',
          __VIEWSTATE: 'detail-token',
        },
        html: detailHtml,
      };
    };

    const config = loadConfig({
      CALENDAR_BASE_URL: 'https://example.com/Calendar',
      CALENDAR_MONTH_COUNT: '1',
    });

    const { AspNetCalendarClient } = await import('../src/source/aspnet.js');
    const originalInitial = AspNetCalendarClient.prototype.loadInitialPage;
    const originalPostBack = AspNetCalendarClient.prototype.postBack;

    AspNetCalendarClient.prototype.loadInitialPage = loadInitialPage;
    AspNetCalendarClient.prototype.postBack = postBack;

    try {
      const events = await scrapeCalendarEvents(config);
      expect(events).toHaveLength(1);
      expect(events[0]?.title).toBe('Early May Bank Holidays (School Closed)');
    } finally {
      AspNetCalendarClient.prototype.loadInitialPage = originalInitial;
      AspNetCalendarClient.prototype.postBack = originalPostBack;
    }
  });
});
