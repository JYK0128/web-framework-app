import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { AdminEmailConfigResponseDto } from '#/modules/system-configs/dto/admin-email/admin-email-config.response.dto';
import { GetAdminEmailConfigQuery } from '#/modules/system-configs/queries/get-admin-email-config.query';
import { SystemConfigService } from '#/modules/system-configs/system-config.service';

@Injectable()
@QueryHandler(GetAdminEmailConfigQuery)
export class GetAdminEmailConfigHandler implements IQueryHandler<GetAdminEmailConfigQuery, AdminEmailConfigResponseDto> {
  constructor(private readonly service: SystemConfigService) {}
  execute(): Promise<AdminEmailConfigResponseDto> { return this.service.getResponse(); }
}
