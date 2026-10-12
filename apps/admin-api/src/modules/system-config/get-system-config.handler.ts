import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { InternalClient } from '#/core/http/internal-client';
import { GetSystemConfigQuery } from '#/modules/system-config/get-system-config.query';
import type { SystemConfigResponseDto } from '#/modules/system-config/system-config.response.dto';

@Injectable()
@QueryHandler(GetSystemConfigQuery)
export class GetSystemConfigHandler implements IQueryHandler<GetSystemConfigQuery, SystemConfigResponseDto> {
  constructor(private readonly internalClient: InternalClient) {}

  execute(): Promise<SystemConfigResponseDto> {
    return this.internalClient.fetch<SystemConfigResponseDto>('/internal/system-configs');
  }
}
