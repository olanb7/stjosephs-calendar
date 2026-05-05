import { z } from 'zod';

import type { AppConfig } from './types.js';

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => value === 'true');

const envSchema = z.object({
  ALLOW_INSECURE_TLS: booleanFromEnv.default(false),
  AzureWebJobsStorage: z.string().optional(),
  BLOB_STORAGE_CONNECTION_STRING: z.string().optional(),
  CALENDAR_BASE_URL: z
    .string()
    .url()
    .default('https://www.stjosephsps.co.uk/Calendar'),
  CALENDAR_MONTH_COUNT: z.coerce.number().int().positive().default(13),
  CALENDAR_TIMEZONE: z.string().default('Europe/London'),
  CALENDAR_USER_AGENT: z
    .string()
    .default('stjosephspta-calendar/0.1 (+https://github.com/olanb7/stjosephspta-calendar)'),
  DAILY_SCHEDULE: z.string().default('0 0 6 * * *'),
  ICS_BLOB_CONTAINER: z.string().default('calendar'),
  ICS_BLOB_NAME: z.string().default('stjosephsps.ics'),
  ICS_CALENDAR_NAME: z.string().default("St Joseph's Primary School Calendar"),
  OUTPUT_FILE_PATH: z.string().default('dist/output/stjosephsps.ics'),
  PUBLIC_FEED_BASE_URL: z.string().optional(),
});

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const env = envSchema.parse(source);

  const config: AppConfig = {
    allowInsecureTls: env.ALLOW_INSECURE_TLS,
    blobContainer: env.ICS_BLOB_CONTAINER,
    blobName: env.ICS_BLOB_NAME,
    calendarBaseUrl: env.CALENDAR_BASE_URL,
    calendarMonthsToFetch: env.CALENDAR_MONTH_COUNT,
    calendarTimezone: env.CALENDAR_TIMEZONE,
    calendarUserAgent: env.CALENDAR_USER_AGENT,
    dailySchedule: env.DAILY_SCHEDULE,
    feedName: env.ICS_CALENDAR_NAME,
    outputFilePath: env.OUTPUT_FILE_PATH,
  };

  const blobConnectionString = env.BLOB_STORAGE_CONNECTION_STRING ?? env.AzureWebJobsStorage;
  if (blobConnectionString) {
    config.blobConnectionString = blobConnectionString;
  }

  if (env.PUBLIC_FEED_BASE_URL) {
    config.publicFeedBaseUrl = env.PUBLIC_FEED_BASE_URL;
  }

  return config;
}
