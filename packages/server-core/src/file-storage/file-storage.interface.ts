import type { Type } from '@nestjs/common';

export interface SaveFileResult { filePath: string, url?: string }
export interface PresignedUploadUrlResult { uploadUrl: string, fileUrl: string, expiresInSeconds: number }

export interface FileStorageAdapter {
  readonly name: string
  saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult>
  readFile(subDir: string, filename: string): Promise<Buffer>
  getPresignedUploadUrl(subDir: string, filename: string, contentType: string, expiresInSeconds: number): Promise<PresignedUploadUrlResult>
  getPublicUrl(subDir: string, filename: string): string
}

export interface FileStorageModuleOptions {
  [name: string]: Type<FileStorageAdapter>
}

export type FileAdapter = FileStorageAdapter;

export type StorageModuleOptions = FileStorageModuleOptions;
