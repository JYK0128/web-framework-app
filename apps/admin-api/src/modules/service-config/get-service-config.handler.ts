import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { InternalClient } from '#/core/internal-client';
import { GetServiceConfigQuery } from '#/modules/service-config/get-service-config.query';
import { GetServiceConfigResponseDto } from '#/modules/service-config/get-service-config.response.dto';

@Injectable()
@QueryHandler(GetServiceConfigQuery)
export class GetServiceConfigHandler implements IQueryHandler<GetServiceConfigQuery, GetServiceConfigResponseDto> {
  constructor(private readonly internalClient: InternalClient) {}

  async execute(): Promise<GetServiceConfigResponseDto> {
    const config = await this.internalClient.fetch<GetServiceConfigResponseDto>('/internal/system-config');
    return GetServiceConfigResponseDto.parse({ operation: config.operation, maintenance: config.maintenance, inquiry: config.inquiry }).validate();
  }
}
