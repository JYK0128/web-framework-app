import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetSystemConfigQuery } from '#/modules/system-config/queries';
import type { SystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

@Injectable()
@QueryHandler(GetSystemConfigQuery)
export class GetSystemConfigHandler implements IQueryHandler<GetSystemConfigQuery, SystemConfigResponseDto> {
  constructor(private readonly service: SystemConfigService) {}

  execute(): Promise<SystemConfigResponseDto> {
    return this.service.getResponse();
  }
}
