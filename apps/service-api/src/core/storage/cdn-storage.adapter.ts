import { Injectable } from '@nestjs/common';
import { type FileStorageAdapter, type PresignedUploadUrlResult, type SaveFileResult } from '@pkg/server-core/file-storage/file-storage.interface';
import { ApplicationError } from '@pkg/shared/common';

import { env } from '#/env';

@Injectable()
export class CDNStorageAdapter implements FileStorageAdapter {
  readonly name = 'cdn';

  async saveFile(_subDir: string, _filename: string, _buffer: Buffer): Promise<SaveFileResult> {
    throw this.unsupportedOperation();
  }

  async readFile(subDir: string, filename: string): Promise<Buffer> {
    try {
      const response = await fetch(this.getPublicUrl(subDir, filename));
      if (response.status === 404) {
        throw new ApplicationError({ code: 'STORAGE_FILE_NOT_FOUND', status: 404 });
      }
      if (!response.ok) {
        throw new ApplicationError({ code: 'STORAGE_READ_ERROR', status: 502 });
      }

      return Buffer.from(await response.arrayBuffer());
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'STORAGE_READ_ERROR', status: 502 });
    }
  }

  async getPresignedUploadUrl(
    _subDir: string,
    _filename: string,
    _contentType: string,
    _expiresInSeconds = 300,
  ): Promise<PresignedUploadUrlResult> {
    throw this.unsupportedOperation();
  }

  getPublicUrl(subDir: string, filename: string): string {
    const baseUrl = this.getBaseUrl();
    const key = this.buildKey(subDir, filename);
    return new URL(key.split('/').map(encodeURIComponent).join('/'), baseUrl).toString();
  }

  private getBaseUrl(): URL {
    if (!env.CDN_URL) {
      throw new ApplicationError({ code: 'CDN_NOT_CONFIGURED', status: 503 });
    }

    return new URL(env.CDN_URL.endsWith('/') ? env.CDN_URL : `${env.CDN_URL}/`);
  }

  private buildKey(subDir: string, filename: string): string {
    const cleanSubDir = subDir.replace(/^\/|\/$/g, '');
    return cleanSubDir ? `${cleanSubDir}/${filename}` : filename;
  }

  private unsupportedOperation(): ApplicationError {
    return new ApplicationError({
      code: 'STORAGE_OPERATION_NOT_SUPPORTED',
      status: 501,
      params: { adapter: this.name },
    });
  }
}
