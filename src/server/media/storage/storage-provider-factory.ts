import { mediaConfig } from '@/lib/media-config';
import type { FileStorageProvider } from './types';
import { LocalFileStorageProvider } from './local-file-storage-provider';
import { S3FileStorageProvider } from './s3-file-storage-provider';

// The only place `mediaConfig.storageProvider` is switched on — every other consumer
// (media.service.ts, every API route) depends on FileStorageProvider only. This is the
// wiring the ticket asks to change when moving local -> S3, and nothing else.
let cached: FileStorageProvider | null = null;

export function getStorageProvider(): FileStorageProvider {
  if (cached) return cached;

  switch (mediaConfig.storageProvider) {
    case 'local':
      cached = new LocalFileStorageProvider(mediaConfig.storageRoot);
      break;
    case 's3':
      cached = new S3FileStorageProvider(mediaConfig.s3);
      break;
    default:
      throw new Error(`Unsupported MEDIA_STORAGE_PROVIDER: ${mediaConfig.storageProvider}`);
  }
  return cached;
}
