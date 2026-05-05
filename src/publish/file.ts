import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { AppConfig, FeedPublisher, PublishedFeed } from '../types.js';

class LocalFilePublisher implements FeedPublisher {
  public constructor(private readonly config: AppConfig) {}

  public async publish(ics: string): Promise<PublishedFeed> {
    await mkdir(dirname(this.config.outputFilePath), { recursive: true });
    await writeFile(this.config.outputFilePath, ics, 'utf8');

    return {
      destination: this.config.publicFeedBaseUrl ?? this.config.outputFilePath,
    };
  }
}

export function createPublisher(config: AppConfig): FeedPublisher {
  return new LocalFilePublisher(config);
}
