import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { type FileStorageAdapter, type PresignedUploadUrlResult, type SaveFileResult } from '@pkg/server-core/file-storage/file-storage.interface';
import { ApplicationError } from '@pkg/shared/common';

import { env } from '#/env';

interface S3StorageOptions {
  bucket: string
  region: string
  endpoint?: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

/** S3 설정은 실제 접근 시점에 검증한다. */
@Injectable()
export class S3StorageAdapter implements FileStorageAdapter {
  readonly name = 's3';
  private readonly s3Config = {
    bucket: env.AWS_S3_BUCKET,
    region: env.AWS_S3_REGION,
    endpoint: env.AWS_S3_ENDPOINT,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    sessionToken: env.AWS_SESSION_TOKEN,
  };

  async saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult> {
    const config = this.ensureConfig();
    const key = this.buildKey(subDir, filename);

    try {
      await this.createClient(config).send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
      }));

      return { filePath: key, url: this.getPublicUrl(subDir, filename) };
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'STORAGE_UPLOAD_ERROR', status: 502 });
    }
  }

  async readFile(subDir: string, filename: string): Promise<Buffer> {
    const config = this.ensureConfig();
    const key = this.buildKey(subDir, filename);

    try {
      const response = await this.createClient(config).send(new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }));
      const body = await response.Body?.transformToByteArray();
      return Buffer.from(body ?? new Uint8Array());
    }
    catch (error) {
      if (this.isMissingObjectError(error)) {
        throw new ApplicationError({ code: 'STORAGE_FILE_NOT_FOUND', status: 404 });
      }
      throw ApplicationError.from(error, { code: 'STORAGE_READ_ERROR', status: 502 });
    }
  }

  async getPresignedUploadUrl(
    subDir: string,
    filename: string,
    contentType: string,
    expiresInSeconds = 300,
  ): Promise<PresignedUploadUrlResult> {
    const config = this.ensureConfig();
    const key = this.buildKey(subDir, filename);

    try {
      const uploadUrl = await getSignedUrl(
        this.createClient(config),
        new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: contentType }),
        { expiresIn: expiresInSeconds, signableHeaders: new Set(['content-type']) },
      );

      return {
        uploadUrl,
        fileUrl: this.getPublicUrl(subDir, filename),
        expiresInSeconds,
      };
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'STORAGE_PRESIGN_ERROR', status: 502 });
    }
  }

  getPublicUrl(subDir: string, filename: string): string {
    const config = this.ensureConfig();
    const key = this.buildKey(subDir, filename);
    const region = config.region;
    let protocol = 'https:';
    let host: string;

    if (config.endpoint) {
      const endpoint = new URL(config.endpoint);
      protocol = endpoint.protocol;
      host = `${config.bucket}.${endpoint.host}`;
    }
    else if (region === 'us-east-1') {
      host = `${config.bucket}.s3.amazonaws.com`;
    }
    else {
      host = `${config.bucket}.s3.${region}.amazonaws.com`;
    }

    return `${protocol}//${host}/${key}`;
  }

  private buildKey(subDir: string, filename: string): string {
    const cleanSubDir = subDir.replace(/^\/|\/$/g, '');
    return cleanSubDir ? `${cleanSubDir}/${filename}` : filename;
  }

  private isMissingObjectError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const candidate = error as { name?: unknown, Code?: unknown, code?: unknown };
    return candidate.name === 'NoSuchKey' || candidate.Code === 'NoSuchKey' || candidate.code === 'NoSuchKey';
  }

  private ensureConfig(): S3StorageOptions {
    const { bucket, region, accessKeyId, secretAccessKey } = this.s3Config;
    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      const missing = [
        !bucket && 'AWS_S3_BUCKET',
        !region && 'AWS_S3_REGION',
        !accessKeyId && 'AWS_ACCESS_KEY_ID',
        !secretAccessKey && 'AWS_SECRET_ACCESS_KEY',
      ].filter(Boolean);
      throw new ApplicationError({
        code: 'S3_STORAGE_NOT_CONFIGURED',
        message: `S3 access requires: ${missing.join(', ')}`,
        status: 503,
      });
    }

    return { ...this.s3Config, bucket, region, accessKeyId, secretAccessKey };
  }

  private createClient(config: S3StorageOptions): S3Client {
    return new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        ...(config.sessionToken && { sessionToken: config.sessionToken }),
      },
    });
  }
}
