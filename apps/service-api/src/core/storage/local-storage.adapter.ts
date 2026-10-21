import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import { type FileStorageAdapter, type PresignedUploadUrlResult, type SaveFileResult } from '@pkg/server-core/file-storage';

import { SERVICE_RUNTIME_CONFIG } from '~/app.config';

@Injectable()
export class LocalStorageAdapter implements FileStorageAdapter {
  readonly name = 'local';
  private readonly baseDir = resolve(process.cwd(), SERVICE_RUNTIME_CONFIG.storage.localDirectory);
  private readonly publicUrlPrefix = SERVICE_RUNTIME_CONFIG.storage.publicUrlPrefix;
  private readonly uploadUrlPrefix = SERVICE_RUNTIME_CONFIG.storage.uploadUrlPrefix;

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
