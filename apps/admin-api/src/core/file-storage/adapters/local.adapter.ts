import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { Inject, Injectable, type OnModuleInit, Optional } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TimeUtil } from '@pkg/shared/common';

import { FILE_STORAGE_MODULE_OPTIONS, type FileStorageAdapter, type FileStorageModuleOptions, type PresignedUploadUrlResult, type SaveFileResult } from '#/core/file-storage/file-storage.interface';

@Injectable()
export class LocalAdapter implements FileStorageAdapter, OnModuleInit {
  readonly name = 'local';
  private readonly baseDir: string;
  private readonly publicUrlPrefix: string;
  private readonly uploadUrlPrefix: string;
  private readonly cacheMaxAgeSeconds: number;

  constructor(
    @Optional() @Inject(FILE_STORAGE_MODULE_OPTIONS) options?: FileStorageModuleOptions,
    @Optional() private readonly httpAdapterHost?: HttpAdapterHost,
  ) {
    this.baseDir = options?.local?.baseDir ?? resolve(process.cwd(), 'data/uploads');
    this.publicUrlPrefix = options?.local?.publicUrlPrefix ?? '/api/v1/uploads';
    this.uploadUrlPrefix = options?.local?.uploadUrlPrefix ?? '/api/v1/uploads';
    this.cacheMaxAgeSeconds = options?.local?.cacheMaxAgeSeconds ?? 86_400;
  }

  async onModuleInit(): Promise<void> {
    if (!this.httpAdapterHost) return;
    await mkdir(this.baseDir, { recursive: true });
    this.httpAdapterHost.httpAdapter.useStaticAssets(this.baseDir, {
      prefix: `${trimTrailingSlashes(this.publicUrlPrefix)}/`,
      dotfiles: 'deny',
      fallthrough: true,
      maxAge: TimeUtil.ms.second(this.cacheMaxAgeSeconds),
    });
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
