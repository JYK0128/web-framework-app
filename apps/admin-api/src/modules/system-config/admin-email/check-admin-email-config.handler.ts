import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { AdminEmailConfigDto } from '#/modules/system-config/admin-email/admin-email-config.dto';
import { CheckAdminEmailConfigQuery } from '#/modules/system-config/admin-email/check-admin-email-config.query';

import { CheckAdminEmailConfigResponseDto } from './check-admin-email-config.response.dto';

@Injectable()
@QueryHandler(CheckAdminEmailConfigQuery)
export class CheckAdminEmailConfigHandler implements IQueryHandler<CheckAdminEmailConfigQuery, CheckAdminEmailConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<CheckAdminEmailConfigResponseDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
    if (!AdminEmailConfigDto.parseEntity(entity).isConfigured()) throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    return CheckAdminEmailConfigResponseDto.parse({ ok: true });
  }
}
