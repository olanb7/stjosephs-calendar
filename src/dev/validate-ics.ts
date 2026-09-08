import { readFile } from 'node:fs/promises';

import { loadConfig } from '../config.js';
import { validateIcsContentLines } from '../feed/validation.js';

const outputFilePath = process.argv[2] ?? loadConfig().outputFilePath;
const ics = await readFile(outputFilePath, 'utf8');

validateIcsContentLines(ics);

console.log(`Validated ICS file: ${outputFilePath}`);
