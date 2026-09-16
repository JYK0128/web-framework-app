import { createHash, createHmac } from 'node:crypto';

import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { type IStorageAdapter, type PresignedUploadUrlResult, type S3StorageOptions, type SaveFileResult, STORAGE_MODULE_OPTIONS, type StorageModuleOptions } from '#/infra/storage/storage.interface';

/**
 * AWS S3 및 S3 호환 스토리지(Cloudflare R2, MinIO) 어댑터
 * AWS Signature Version 4 (SigV4) 기반 직접 연동
 */
@Injectable()
export class S3StorageAdapter implements IStorageAdapter {
  readonly name = 's3';
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly s3Config?: S3StorageOptions;

  constructor(
    @Optional()
    @Inject(STORAGE_MODULE_OPTIONS)
    options?: StorageModuleOptions,
  ) {
    this.s3Config = options?.s3;
  }

  async saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult> {
    const config = this.ensureConfig();
    const key = this.buildKey(subDir, filename);
    const host = this.getHost(config);
    const url = `https://${host}/${key}`;

    const headers: Record<string, string> = {
      host,
      'x-amz-content-sha256': createHash('sha256').update(buffer).digest('hex'),
      'content-length': buffer.length.toString(),
    };

    const signedHeaders = this.signRequest('PUT', `/${key}`, headers, config);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: signedHeaders,
        body: buffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[S3Storage] Upload failed (${response.status}): ${errorText}`);
        throw new ApplicationError({
          code: 'STORAGE_UPLOAD_FAILED',
          message: `S3 upload failed with status ${response.status}`,
          status: 502,
        });
      }

      return {
        filePath: key,
        url: this.getPublicUrl(subDir, filename),
      };
    }
    catch (err) {
      if (err instanceof ApplicationError) throw err;
      throw new ApplicationError({
        code: 'STORAGE_UPLOAD_ERROR',
        message: err instanceof Error ? err.message : 'S3 upload error',
        status: 502,
      });
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
    const host = this.getHost(config);
    const region = config.region ?? 'us-east-1';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const credential = `${config.accessKeyId}/${dateStamp}/${region}/s3/aws4_request`;

    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': expiresInSeconds.toString(),
      'X-Amz-SignedHeaders': 'content-type;host',
    };

    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
    const signedHeaders = 'content-type;host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      'PUT',
      `/${key}`,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      `${dateStamp}/${region}/s3/aws4_request`,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = this.getSignatureKey(config.secretAccessKey ?? '', dateStamp, region, 's3');
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const uploadUrl = `https://${host}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

    return {
      uploadUrl,
      fileUrl: this.getPublicUrl(subDir, filename),
      expiresInSeconds,
    };
  }

  getPublicUrl(subDir: string, filename: string): string {
    const key = this.buildKey(subDir, filename);
    if (this.s3Config?.publicUrlPrefix) {
      const cleanPrefix = this.s3Config.publicUrlPrefix.replace(/\/$/, '');
      return `${cleanPrefix}/${key}`;
    }
    const config = this.ensureConfig();
    const host = this.getHost(config);
    return `https://${host}/${key}`;
  }

  private buildKey(subDir: string, filename: string): string {
    const cleanSubDir = subDir.replace(/^\/|\/$/g, '');
    return cleanSubDir ? `${cleanSubDir}/${filename}` : filename;
  }

  private getHost(config: S3StorageOptions): string {
    if (config.endpoint) {
      const stripped = config.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
      return `${config.bucket}.${stripped}`;
    }
    const region = config.region ?? 'us-east-1';
    return region === 'us-east-1'
      ? `${config.bucket}.s3.amazonaws.com`
      : `${config.bucket}.s3.${region}.amazonaws.com`;
  }

  private ensureConfig(): S3StorageOptions {
    if (!this.s3Config?.bucket || !this.s3Config.accessKeyId || !this.s3Config.secretAccessKey) {
      throw new ApplicationError({
        code: 'S3_STORAGE_NOT_CONFIGURED',
        message: 'S3 storage credentials (bucket, accessKeyId, secretAccessKey) are missing',
        status: 500,
      });
    }
    return this.s3Config;
  }

  private signRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    config: S3StorageOptions,
  ): Record<string, string> {
    const region = config.region ?? 'us-east-1';
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    headers['x-amz-date'] = amzDate;

    const sortedHeaderKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedHeaderKeys.map((k) => `${k.toLowerCase()}:${headers[k]}\n`).join('');
    const signedHeaders = sortedHeaderKeys.map((k) => k.toLowerCase()).join(';');

    const canonicalRequest = [
      method,
      path,
      '',
      canonicalHeaders,
      signedHeaders,
      headers['x-amz-content-sha256'],
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      `${dateStamp}/${region}/s3/aws4_request`,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = this.getSignatureKey(config.secretAccessKey ?? '', dateStamp, region, 's3');
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const credential = `${config.accessKeyId}/${dateStamp}/${region}/s3/aws4_request`;
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return headers;
  }

  private getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
    const kDate = createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
    const kRegion = createHmac('sha256', kDate).update(regionName).digest();
    const kService = createHmac('sha256', kRegion).update(serviceName).digest();
    return createHmac('sha256', kService).update('aws4_request').digest();
  }
}
