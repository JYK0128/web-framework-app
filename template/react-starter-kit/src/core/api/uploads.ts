import { API_PREFIX } from '#/configs/app.config';
import { axios } from '#/core/config/axios';

export type UploadOAuthIconResponse = {
  url: string
};

export function uploadOAuthIcon(file: File): Promise<UploadOAuthIconResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return axios<UploadOAuthIconResponse>({
    url: `${API_PREFIX}/uploads/admin/oauth-icon`,
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData,
  });
}
