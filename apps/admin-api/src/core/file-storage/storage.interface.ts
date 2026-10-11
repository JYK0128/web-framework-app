export interface SaveFileResult { filePath: string, url?: string }
export interface PresignedUploadUrlResult { uploadUrl: string, fileUrl: string, expiresInSeconds: number }

export interface FileAdapter {
  readonly name: string
  saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult>
  readFile(subDir: string, filename: string): Promise<Buffer>
  getPresignedUploadUrl(subDir: string, filename: string, contentType: string, expiresInSeconds: number): Promise<PresignedUploadUrlResult>
  getPublicUrl(subDir: string, filename: string): string
}

export interface S3Options {
  bucket: string
  region?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
  publicUrlPrefix?: string
}

export interface StorageModuleOptions {
  driver?: 'local' | 's3'
  local?: { baseDir?: string, publicUrlPrefix?: string, uploadUrlPrefix?: string }
  s3?: S3Options
}

export const FILE_ADAPTER = Symbol('FILE_ADAPTER');
export const STORAGE_MODULE_OPTIONS = Symbol('STORAGE_MODULE_OPTIONS');
