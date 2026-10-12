import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { InternalClient } from '#/core/http/internal-client';
import type { SystemConfigResponseDto } from '#/modules/system-config/dto/system-config.response.dto';
import { GetSystemConfigQuery } from '#/modules/system-config/queries/get-system-config.query';

@Injectable()
@QueryHandler(GetSystemConfigQuery)
export class GetSystemConfigHandler implements IQueryHandler<GetSystemConfigQuery, SystemConfigResponseDto> {
  constructor(private readonly internalClient: InternalClient) {}

  execute(): Promise<SystemConfigResponseDto> {
    return this.internalClient.fetch<SystemConfigResponseDto>('/internal/system-configs');
  }
}
