export interface SaveFileResult {
  filePath: string
  url?: string
}

export interface PresignedUploadUrlResult {
  uploadUrl: string
  fileUrl: string
  expiresInSeconds: number
}

export interface IStorageAdapter {
  readonly name: string
  saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult>
  getPresignedUploadUrl(subDir: string, filename: string, contentType: string, expiresInSeconds?: number): Promise<PresignedUploadUrlResult>
  getPublicUrl(subDir: string, filename: string): string
}

export interface LocalStorageOptions {
  baseDir?: string
  publicUrlPrefix?: string
  uploadUrlPrefix?: string
}

export interface StorageModuleOptions {
  local?: LocalStorageOptions
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');
export const STORAGE_MODULE_OPTIONS = Symbol('STORAGE_MODULE_OPTIONS');
