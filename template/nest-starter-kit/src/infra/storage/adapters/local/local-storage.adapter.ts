import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { Inject, Injectable, Optional } from '@nestjs/common';

import { type IStorageAdapter, type PresignedUploadUrlResult, type SaveFileResult, STORAGE_MODULE_OPTIONS, type StorageModuleOptions } from '#/infra/storage/storage.interface';

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  readonly name = 'local';
  private readonly baseDir: string;
  private readonly publicUrlPrefix: string;
  private readonly uploadUrlPrefix: string;

  constructor(
    @Optional()
    @Inject(STORAGE_MODULE_OPTIONS)
    options?: StorageModuleOptions,
  ) {
    this.baseDir = options?.local?.baseDir ?? resolve(process.cwd(), 'data/uploads');
    this.publicUrlPrefix = options?.local?.publicUrlPrefix ?? '/api/v1/uploads';
    this.uploadUrlPrefix = options?.local?.uploadUrlPrefix ?? '/api/v1/uploads';
  }

  async saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult> {
    const targetDir = join(this.baseDir, subDir);
    await mkdir(targetDir, { recursive: true });

    const filePath = join(targetDir, filename);
    await writeFile(filePath, buffer, {
      flag: 'w',
      mode: 0o644,
    });

    return {
      filePath,
      url: this.getPublicUrl(subDir, filename),
    };
  }

  async getPresignedUploadUrl(
    subDir: string,
    filename: string,
    _contentType: string,
    expiresInSeconds = 300,
  ): Promise<PresignedUploadUrlResult> {
    const cleanPrefix = this.uploadUrlPrefix.replace(/\/$/, '');
    const cleanSubDir = subDir.replace(/^\/|\/$/g, '');
    const uploadUrl = `${cleanPrefix}/${cleanSubDir}/${filename}`;
    const fileUrl = this.getPublicUrl(subDir, filename);

    return {
      uploadUrl,
      fileUrl,
      expiresInSeconds,
    };
  }

  getPublicUrl(subDir: string, filename: string): string {
    const cleanPrefix = this.publicUrlPrefix.replace(/\/$/, '');
    const cleanSubDir = subDir.replace(/^\/|\/$/g, '');
    return `${cleanPrefix}/${cleanSubDir}/${filename}`;
  }
}
