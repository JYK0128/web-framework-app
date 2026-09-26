import { Injectable } from '@nestjs/common';
import type { SystemConfigCode } from '@pkg/shared/common';

import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import type { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto } from './dto/create-oauth-icon-presigned-url.dto';
import type { SystemConfigResponseDto, UpdateSystemConfigRequestDto } from './system-config.interfaces';

@Injectable()
export class ServiceSystemConfigClient {
  constructor(private readonly internalClient: InternalServiceClient) {}

  getResponse(): Promise<SystemConfigResponseDto> {
    return this.internalClient.fetchServiceApi<SystemConfigResponseDto>('/api/v1/internal/system-configs');
  }

  update(values: UpdateSystemConfigRequestDto): Promise<SystemConfigCode[]> {
    return this.internalClient.fetchServiceApi<SystemConfigCode[]>('/api/v1/internal/system-configs', {
      method: 'PATCH',
      body: values,
    });
  }

  async createOAuthIconPresignedUrl(input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    const result = await this.internalClient.fetchServiceApi<CreateOAuthIconPresignedUrlResponseDto>('/api/v1/internal/system-configs/oauth-icons/presigned-url', {
      method: 'POST',
      body: input,
    });
    return { ...result, uploadUrl: `/api/v1/uploads/oauth-icons/${result.fileUrl.split('/').pop()}` };
  }

  syncToRedis(): Promise<{ ok: true, message: string }> {
    return this.internalClient.fetchServiceApi('/api/v1/internal/system-configs/sync', { method: 'POST' });
  }
}
