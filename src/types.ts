export type HiddenFieldMap = Record<string, string>;

export interface CalendarPageState {
  html: string;
  hiddenFields: HiddenFieldMap;
}

export interface MonthEventLink {
  title: string;
  target: string;
  dayLabel?: string;
}

export interface MonthView {
  monthLabel: string;
  nextMonthTarget?: string;
  previousMonthTarget?: string;
  eventLinks: MonthEventLink[];
}

export interface RawCalendarEvent {
  title: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  description?: string;
  moreInfo?: string;
  moreInfoUrl?: string;
  sourceTarget: string;
  sourceMonth: string;
}

export interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  timezone: string;
  url?: string;
}

export interface PublishedFeed {
  destination: string;
}

export interface FeedPublisher {
  publish(ics: string): Promise<PublishedFeed>;
}

export interface AppConfig {
  allowInsecureTls: boolean;
  calendarBaseUrl: string;
  calendarMonthsToFetch: number;
  calendarTimezone: string;
  calendarUserAgent: string;
  feedName: string;
  outputFilePath: string;
  publicFeedBaseUrl?: string;
}
