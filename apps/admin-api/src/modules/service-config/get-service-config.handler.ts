import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { InternalClient } from '#/core/http/internal-client';
import type { ServiceSystemConfigResponseDto } from '#/modules/service-config/service-system-config.response.dto';

import { GetServiceConfigQuery } from './get-service-config.query';
import { ServiceConfigResponseDto } from './service-config.response.dto';

@Injectable()
@QueryHandler(GetServiceConfigQuery)
export class GetServiceConfigHandler implements IQueryHandler<GetServiceConfigQuery, ServiceConfigResponseDto> {
  constructor(private readonly internalClient: InternalClient) {}

  async execute(): Promise<ServiceConfigResponseDto> {
    const config = await this.internalClient.fetch<ServiceSystemConfigResponseDto>('/internal/system-configs');
    return ServiceConfigResponseDto.parse({ operation: config.operation, maintenance: config.maintenance, inquiry: config.inquiry });
  }
}
