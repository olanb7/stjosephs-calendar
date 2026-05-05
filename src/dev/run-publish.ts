import { loadConfig } from '../config.js';
import { runCalendarPublication } from '../app/sync.js';

const config = loadConfig();
const result = await runCalendarPublication(config);

console.log(JSON.stringify(result, null, 2));
