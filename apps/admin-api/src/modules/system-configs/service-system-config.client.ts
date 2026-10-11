import { Injectable } from '@nestjs/common';
import type { ServiceSystemConfigCode } from '@pkg/shared/constants';
import { type DeliveryConfigDto } from '@pkg/shared/server';

import { InternalClient } from '#/core/auth/machine/internal-client';
import type { CreateOAuthIconPresignedUrlRequestDto } from '#/modules/system-configs/dto/create-oauth-icon-presigned-url.request.dto';
import type { CreateOAuthIconPresignedUrlResponseDto } from '#/modules/system-configs/dto/create-oauth-icon-presigned-url.response.dto';
import type { SystemConfigResponseDto } from '#/modules/system-configs/dto/system-config.response.dto';
import type { UpdateSystemConfigRequestDto } from '#/modules/system-configs/dto/update-system-config.request.dto';

@Injectable()
export class ServiceSystemConfigClient {
  constructor(private readonly internalClient: InternalClient) {}

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
    return { ...result, uploadUrl: `/api/v1/uploads/oauth-icons/${result.fileUrl.split('/').pop()}` };
  }

  syncToRedis(): Promise<{ ok: true }> {
    return this.internalClient.fetch('/internal/system-configs/sync', { method: 'POST' });
  }
}
