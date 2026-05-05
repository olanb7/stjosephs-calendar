import { loadConfig } from '../config.js';
import { scrapeCalendarEvents } from '../app/sync.js';

const config = loadConfig();
const events = await scrapeCalendarEvents(config);

console.log(JSON.stringify(events, null, 2));
