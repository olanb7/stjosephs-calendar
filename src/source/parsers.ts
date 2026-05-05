import { load } from 'cheerio';

import type { MonthView, RawCalendarEvent } from '../types.js';

function collapseWhitespace(value: string | undefined): string | undefined {
  const trimmed = value?.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed : undefined;
}

function extractPostBackTarget(href: string | undefined): string | undefined {
  const match = href?.match(/__doPostBack\('([^']+)'/);
  return match?.[1];
}

export function parseMonthView(html: string): MonthView {
  const $ = load(html);
  const monthLabel = collapseWhitespace($('#MainContent_ctlCalendar_repCalendar_lblCurrentMonth').text());

  if (!monthLabel) {
    throw new Error('Unable to locate the current month label in calendar HTML');
  }

  const eventLinks = $('.DayEvents a.EventLink')
    .map((_, element) => {
      const title = collapseWhitespace($(element).text());
      const target = extractPostBackTarget($(element).attr('href'));
      const dayLabel = collapseWhitespace($(element).closest('.CalendarDay').find('.DayDate').first().text());

      if (!title || !target) {
        return undefined;
      }

      return {
        ...(dayLabel ? { dayLabel } : {}),
        target,
        title,
      };
    })
    .get()
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    eventLinks,
    monthLabel,
    nextMonthTarget: extractPostBackTarget($('#MainContent_ctlCalendar_repCalendar_lnkNextMonth').attr('href')),
    previousMonthTarget: extractPostBackTarget($('#MainContent_ctlCalendar_repCalendar_lnkPrevMonth').attr('href')),
  };
}

export function parseEventDetails(
  html: string,
  context: { sourceMonth: string; sourceTarget: string },
): RawCalendarEvent[] {
  const $ = load(html);
  const detailItems = $('#MainContent_ctlCalendar_pnlEventDetails .EventItem.EventListDetail');

  return detailItems
    .map((_, element) => {
      const title = collapseWhitespace($(element).find('[id*="lblEventName"]').first().text());
      const startDate = collapseWhitespace($(element).find('[id*="lblStartDate"]').first().text());

      if (!title || !startDate) {
        return undefined;
      }

      const moreInfoLink = $(element).find('[id*="lnkURL"]').first();
      const rawHref = moreInfoLink.attr('href');
      const moreInfoUrl =
        rawHref && rawHref.trim() !== '' && rawHref.trim().toLowerCase() !== 'javascript:void(0);'
          ? rawHref.trim()
          : undefined;

      return {
        ...(collapseWhitespace($(element).find('[id*="lblDescription"]').first().text())
          ? { description: collapseWhitespace($(element).find('[id*="lblDescription"]').first().text()) }
          : {}),
        ...(collapseWhitespace($(element).find('[id*="lblEndDate"]').first().text())
          ? { endDate: collapseWhitespace($(element).find('[id*="lblEndDate"]').first().text()) }
          : {}),
        ...(collapseWhitespace($(element).find('[id*="lblEndTime"]').first().text())
          ? { endTime: collapseWhitespace($(element).find('[id*="lblEndTime"]').first().text()) }
          : {}),
        ...(collapseWhitespace($(element).find('[id*="lblMoreInfo"]').first().text())
          ? { moreInfo: collapseWhitespace($(element).find('[id*="lblMoreInfo"]').first().text()) }
          : {}),
        ...(moreInfoUrl ? { moreInfoUrl } : {}),
        sourceMonth: context.sourceMonth,
        sourceTarget: context.sourceTarget,
        startDate,
        ...(collapseWhitespace($(element).find('[id*="lblStartTime"]').first().text())
          ? { startTime: collapseWhitespace($(element).find('[id*="lblStartTime"]').first().text()) }
          : {}),
        title,
      };
    })
    .get()
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}
