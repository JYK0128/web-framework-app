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

  /**
   * 버퍼 파일을 저장소에 직접 저장합니다.
   */
  saveFile(subDir: string, filename: string, buffer: Buffer): Promise<SaveFileResult>

  /**
   * 클라이언트가 스토리지로 직접 업로드할 수 있는 Presigned Upload URL을 생성합니다.
   */
  getPresignedUploadUrl(
    subDir: string,
    filename: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<PresignedUploadUrlResult>

  /**
   * 저장된 파일의 공개/CDN 접근 URL을 반환합니다.
   */
  getPublicUrl(subDir: string, filename: string): string
}

export type StorageDriver = 'local' | 's3';

export interface LocalStorageOptions {
  baseDir?: string
  publicUrlPrefix?: string
  uploadUrlPrefix?: string
}

export interface S3StorageOptions {
  bucket: string
  region?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
  publicUrlPrefix?: string
}

export interface StorageModuleOptions {
  driver?: StorageDriver
  local?: LocalStorageOptions
  s3?: S3StorageOptions
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');
export const STORAGE_MODULE_OPTIONS = Symbol('STORAGE_MODULE_OPTIONS');
