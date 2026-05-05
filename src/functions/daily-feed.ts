import { app, type InvocationContext, type Timer } from '@azure/functions';

import { runCalendarPublication } from '../app/sync.js';
import { loadConfig } from '../config.js';

export async function dailyCalendarFeed(_: Timer, context: InvocationContext): Promise<void> {
  const config = loadConfig();
  const result = await runCalendarPublication(config);

  context.log(`Published ${result.eventCount} events to ${result.destination}`);
}

app.timer('daily-calendar-feed', {
  handler: dailyCalendarFeed,
  runOnStartup: false,
  schedule: process.env.DAILY_SCHEDULE ?? '0 0 6 * * *',
});
