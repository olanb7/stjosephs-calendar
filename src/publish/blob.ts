import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { BlobServiceClient } from '@azure/storage-blob';

import type { AppConfig, FeedPublisher, PublishedFeed } from '../types.js';

class AzureBlobPublisher implements FeedPublisher {
  public constructor(private readonly config: AppConfig) {}

  public async publish(ics: string): Promise<PublishedFeed> {
    if (!this.config.blobConnectionString) {
      throw new Error('Missing blob storage connection string');
    }

    const serviceClient = BlobServiceClient.fromConnectionString(this.config.blobConnectionString);
    const containerClient = serviceClient.getContainerClient(this.config.blobContainer);
    await containerClient.createIfNotExists({ access: 'blob' });

    const blobClient = containerClient.getBlockBlobClient(this.config.blobName);
    await blobClient.upload(ics, Buffer.byteLength(ics), {
      blobHTTPHeaders: {
        blobCacheControl: 'public, max-age=3600',
        blobContentType: 'text/calendar; charset=utf-8',
      },
    });

    return {
      destination:
        this.config.publicFeedBaseUrl ??
        blobClient.url,
    };
  }
}

class LocalFilePublisher implements FeedPublisher {
  public constructor(private readonly outputFilePath: string) {}

  public async publish(ics: string): Promise<PublishedFeed> {
    await mkdir(dirname(this.outputFilePath), { recursive: true });
    await writeFile(this.outputFilePath, ics, 'utf8');

    return {
      destination: this.outputFilePath,
    };
  }
}

export function createPublisher(config: AppConfig): FeedPublisher {
  return config.blobConnectionString ? new AzureBlobPublisher(config) : new LocalFilePublisher(config.outputFilePath);
}
