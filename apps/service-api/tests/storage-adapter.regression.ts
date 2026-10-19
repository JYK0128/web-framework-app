import 'reflect-metadata';

import assert from 'node:assert/strict';
import { dirname } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { FileStorageModule } from '@pkg/server-core/file-storage/file-storage.module';
import { FileStorageService } from '@pkg/server-core/file-storage/file-storage.service';
import { serveStorageFiles } from '@pkg/server-core/file-storage/storage.http';
import { LocalStorageAdapter } from '#/core/storage/local-storage.adapter';
import { S3StorageAdapter } from '#/core/storage/s3-storage.adapter';
import { env } from '#/env';

const app = await NestFactory.create<NestExpressApplication>(FileStorageModule.forRoot({ local: LocalStorageAdapter, s3: S3StorageAdapter }), { logger: false });
try {
  const storage = app.get(FileStorageService);
  const local = storage.use('local');
  assert.ok(local instanceof LocalStorageAdapter);
  const bytes = Buffer.from('storage regression');
  const saved = await local.saveFile('regression', 'file.txt', bytes);
  assert.deepEqual(await local.readFile('regression', 'file.txt'), bytes);
  const upload = await local.getPresignedUploadUrl('regression', 'file.txt', 'text/plain', 60);
  assert.equal(upload.fileUrl, saved.url);
  await serveStorageFiles(app, { directory: dirname(dirname(saved.filePath)), publicUrlPrefix: local.getPublicUrl('', ''), cacheMaxAgeSeconds: 60 });
  await app.listen(0, '127.0.0.1');
  const response = await fetch(`${await app.getUrl()}${saved.url}`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), bytes.toString());
}
finally { await app.close(); }

env.STORAGE_S3_BUCKET = 'test-bucket';
env.STORAGE_S3_ACCESS_KEY_ID = 'test-key';
env.STORAGE_S3_SECRET_ACCESS_KEY = 'test-secret';
const s3App = await NestFactory.createApplicationContext(FileStorageModule.forRoot({ local: LocalStorageAdapter, s3: S3StorageAdapter }), { logger: false });
try {
  const storage = s3App.get(FileStorageService);
  const s3 = storage.use('s3');
  assert.ok(s3 instanceof S3StorageAdapter);
  const result = await s3.getPresignedUploadUrl('regression', 'file.txt', 'text/plain', 60);
  const url = new URL(result.uploadUrl);
  assert.equal(url.hostname, 'test-bucket.s3.amazonaws.com');
  assert.equal(url.searchParams.get('X-Amz-Expires'), '60');
  assert.ok(url.searchParams.get('X-Amz-Signature'));
}
finally { await s3App.close(); }
console.log('Storage adapter regression checks passed.');
