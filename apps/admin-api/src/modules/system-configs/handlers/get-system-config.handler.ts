import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetSystemConfigQuery } from '#/modules/system-configs/queries';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';
import type { SystemConfigResponseDto } from '#/modules/system-configs/system-config.interfaces';

@Injectable()
@QueryHandler(GetSystemConfigQuery)
export class GetSystemConfigHandler implements IQueryHandler<GetSystemConfigQuery, SystemConfigResponseDto> {
  constructor(private readonly service: ServiceSystemConfigClient) {}

  execute(): Promise<SystemConfigResponseDto> {
    return this.service.getResponse();
  }
}
