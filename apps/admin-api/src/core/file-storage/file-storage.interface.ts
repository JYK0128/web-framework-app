export interface SaveFileResult { filePath: string, url?: string }
export interface PresignedUploadUrlResult { uploadUrl: string, fileUrl: string, expiresInSeconds: number }

export interface FileStorageAdapter {
  readonly name: string
  saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult>
  readFile(subDir: string, filename: string): Promise<Buffer>
  getPresignedUploadUrl(subDir: string, filename: string, contentType: string, expiresInSeconds: number): Promise<PresignedUploadUrlResult>
  getPublicUrl(subDir: string, filename: string): string
}

export interface S3StorageOptions {
  bucket: string
  region?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
  publicUrlPrefix?: string
}

export interface FileStorageModuleOptions {
  driver?: 'local' | 's3'
  local?: { baseDir?: string, publicUrlPrefix?: string, uploadUrlPrefix?: string, cacheMaxAgeSeconds?: number }
  s3?: S3StorageOptions
}

export const FILE_STORAGE_ADAPTER = Symbol('FILE_STORAGE_ADAPTER');
export const FILE_STORAGE_MODULE_OPTIONS = Symbol('FILE_STORAGE_MODULE_OPTIONS');
