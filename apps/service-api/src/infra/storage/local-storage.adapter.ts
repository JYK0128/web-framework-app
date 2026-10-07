import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { Inject, Injectable, Optional } from '@nestjs/common';
import { API_BASE_PATH } from '@pkg/shared/config';

import { type IStorageAdapter, type PresignedUploadUrlResult, type SaveFileResult, STORAGE_MODULE_OPTIONS, type StorageModuleOptions } from './storage.interface';

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  readonly name = 'local';
  private readonly baseDir: string;
  private readonly publicUrlPrefix: string;
  private readonly uploadUrlPrefix: string;

  constructor(@Optional() @Inject(STORAGE_MODULE_OPTIONS) options?: StorageModuleOptions) {
    this.baseDir = options?.local?.baseDir ?? resolve(process.cwd(), 'data/uploads');
    this.publicUrlPrefix = options?.local?.publicUrlPrefix ?? `${API_BASE_PATH}/uploads`;
    this.uploadUrlPrefix = options?.local?.uploadUrlPrefix ?? `${API_BASE_PATH}/uploads`;
  }

  async saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult> {
    const targetDir = join(this.baseDir, subDir);
    await mkdir(targetDir, { recursive: true });
    const filePath = join(targetDir, filename);
    await writeFile(filePath, buffer, { flag: 'w', mode: 0o644 });
    return { filePath, url: this.getPublicUrl(subDir, filename) };
  }

  async readFile(subDir: string, filename: string): Promise<Buffer> {
    return readFile(join(this.baseDir, subDir, filename));
  }

  async getPresignedUploadUrl(subDir: string, filename: string, _contentType: string, expiresInSeconds: number): Promise<PresignedUploadUrlResult> {
    const prefix = trimTrailingSlashes(this.uploadUrlPrefix);
    const cleanSubDir = subDir.replace(/^\/|\/$/g, '');
    return { uploadUrl: `${prefix}/${cleanSubDir}/${filename}`, fileUrl: this.getPublicUrl(subDir, filename), expiresInSeconds };
  }

  getPublicUrl(subDir: string, filename: string): string {
    const prefix = trimTrailingSlashes(this.publicUrlPrefix);
    const cleanSubDir = subDir.replace(/^\/|\/$/g, '');
    return `${prefix}/${cleanSubDir}/${filename}`;
  }
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end -= 1;
  return value.slice(0, end);
}
