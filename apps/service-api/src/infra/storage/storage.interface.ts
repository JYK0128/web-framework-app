export interface SaveFileResult { filePath: string, url?: string }
export interface PresignedUploadUrlResult { uploadUrl: string, fileUrl: string, expiresInSeconds: number }

export interface IStorageAdapter {
  readonly name: string
  saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult>
  readFile(subDir: string, filename: string): Promise<Buffer>
  getPresignedUploadUrl(subDir: string, filename: string, contentType: string, expiresInSeconds?: number): Promise<PresignedUploadUrlResult>
  getPublicUrl(subDir: string, filename: string): string
}

export interface StorageModuleOptions { local?: { baseDir?: string, publicUrlPrefix?: string, uploadUrlPrefix?: string } }

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');
export const STORAGE_MODULE_OPTIONS = Symbol('STORAGE_MODULE_OPTIONS');
