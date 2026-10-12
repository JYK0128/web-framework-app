import { Injectable, NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { AdminEmailConfigResponseDto } from '#/modules/system-config/dto/admin-email/admin-email-config.response.dto';
import { GetAdminEmailConfigQuery } from '#/modules/system-config/queries/get-admin-email-config.query';

@Injectable()
@QueryHandler(GetAdminEmailConfigQuery)
export class GetAdminEmailConfigHandler implements IQueryHandler<GetAdminEmailConfigQuery, AdminEmailConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<AdminEmailConfigResponseDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
    return AdminEmailConfigResponseDto.parseEntity(entity);
  }
}
