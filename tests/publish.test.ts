import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';
import { createPublisher } from '../src/publish/file.js';

describe('file publishing', () => {
  it('writes the feed to disk and reports the public URL when configured', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'stjosephs-calendar-'));
    const outputFilePath = join(tempDir, 'stjosephsps.ics');

    try {
      const config = loadConfig({
        CALENDAR_BASE_URL: 'https://www.stjosephsps.co.uk/Calendar',
        OUTPUT_FILE_PATH: outputFilePath,
        PUBLIC_FEED_BASE_URL: 'https://example.com/stjosephsps.ics',
      });

      const publisher = createPublisher(config);
      const result = await publisher.publish('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n');

      expect(await readFile(outputFilePath, 'utf8')).toContain('BEGIN:VCALENDAR');
      expect(result.destination).toBe('https://example.com/stjosephsps.ics');
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });
});
