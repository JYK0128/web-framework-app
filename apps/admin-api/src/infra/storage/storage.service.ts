import { Inject, Injectable } from '@nestjs/common';

import { type IStorageAdapter, type PresignedUploadUrlResult, type SaveFileResult, STORAGE_ADAPTER } from './storage.interface';

@Injectable()
export class StorageService implements IStorageAdapter {
  constructor(@Inject(STORAGE_ADAPTER) private readonly adapter: IStorageAdapter) {}

  get name(): string { return this.adapter.name; }

  saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult> {
    return this.adapter.saveFile(subDir, filename, buffer);
  }

  getPresignedUploadUrl(subDir: string, filename: string, contentType: string, expiresInSeconds = 300): Promise<PresignedUploadUrlResult> {
    return this.adapter.getPresignedUploadUrl(subDir, filename, contentType, expiresInSeconds);
  }

  getPublicUrl(subDir: string, filename: string): string { return this.adapter.getPublicUrl(subDir, filename); }
}
