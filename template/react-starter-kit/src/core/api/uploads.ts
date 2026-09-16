import { API_PREFIX } from '#/configs/app.config';
import { axios } from '#/core/config/axios';

export type UploadOAuthIconResponse = {
  url: string
};

export type CreateOAuthIconPresignedUrlResponse = {
  uploadUrl: string
  fileUrl: string
  expiresInSeconds: number
};

export async function uploadOAuthIcon(file: File): Promise<UploadOAuthIconResponse> {
  // 1. Presigned Upload URL 발급 요청
  const presigned = await axios<CreateOAuthIconPresignedUrlResponse>({
    url: `${API_PREFIX}/system-config/admin/oauth-icon/presigned-url`,
    method: 'POST',
    data: {
      filename: file.name,
      contentType: file.type || 'image/png',
      fileSize: file.size,
    },
  });

  // 2. 스토리지(S3/R2 또는 로컬 업로드 엔드포인트)로 바이너리 직접 PUT 업로드
  const response = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'image/png',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`스토리지 업로드에 실패했습니다. (HTTP ${response.status})`);
  }

  // 3. 최종 저장된 공개 파일 접근 URL 반환
  return {
    url: presigned.fileUrl,
  };
}
