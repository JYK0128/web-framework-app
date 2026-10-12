import type { FileStorageAdapter, PresignedUploadUrlResult, SaveFileResult } from './file-storage.interface';

export abstract class FileStorageService implements FileStorageAdapter {
  abstract readonly name: string;
  abstract saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult>;
  abstract readFile(subDir: string, filename: string): Promise<Buffer>;
  abstract getPresignedUploadUrl(subDir: string, filename: string, contentType: string, expiresInSeconds: number): Promise<PresignedUploadUrlResult>;
  abstract getPublicUrl(subDir: string, filename: string): string;
}
