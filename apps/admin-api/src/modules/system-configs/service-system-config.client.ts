import { Injectable } from '@nestjs/common';
import { API_BASE_PATH, type ServiceSystemConfigCode } from '@pkg/shared/common';
import type { DeliveryConfigDto } from '@pkg/shared/server';

import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import type { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto } from './dto/create-oauth-icon-presigned-url.dto';
import type { SystemConfigResponseDto, UpdateSystemConfigRequestDto } from './system-config.interfaces';

@Injectable()
export class ServiceSystemConfigClient {
  constructor(private readonly internalClient: InternalServiceClient) {}

  getResponse(): Promise<SystemConfigResponseDto> {
    return this.internalClient.fetch<SystemConfigResponseDto>('/internal/system-configs');
  }

  getDeliveryConfigForTest(overrides: Partial<DeliveryConfigDto>): Promise<DeliveryConfigDto> {
    return this.internalClient.fetch<DeliveryConfigDto>('/internal/system-configs/delivery-config-for-test', {
      method: 'POST',
      body: overrides,
    });
  }

  update(values: UpdateSystemConfigRequestDto): Promise<ServiceSystemConfigCode[]> {
    return this.internalClient.fetch<ServiceSystemConfigCode[]>('/internal/system-configs', {
      method: 'PATCH',
      body: values,
    });
  }

  async createOAuthIconPresignedUrl(input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    const result = await this.internalClient.fetch<CreateOAuthIconPresignedUrlResponseDto>('/internal/system-configs/oauth-icons/presigned-url', {
      method: 'POST',
      body: input,
    });
    return { ...result, uploadUrl: `${API_BASE_PATH}/uploads/oauth-icons/${result.fileUrl.split('/').pop()}` };
  }

  syncToRedis(): Promise<{ ok: true, message: string }> {
    return this.internalClient.fetch('/internal/system-configs/sync', { method: 'POST' });
  }
}
