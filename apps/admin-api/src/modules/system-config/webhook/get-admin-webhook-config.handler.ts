import { Injectable, NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { AdminWebhookConfigResponseDto } from '#/modules/system-config/webhook/admin-webhook-config.response.dto';
import { GetAdminWebhookConfigQuery } from '#/modules/system-config/webhook/get-admin-webhook-config.query';

@Injectable()
@QueryHandler(GetAdminWebhookConfigQuery)
export class GetAdminWebhookConfigHandler implements IQueryHandler<GetAdminWebhookConfigQuery, AdminWebhookConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<AdminWebhookConfigResponseDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.WEBHOOK }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 웹훅 설정을 찾을 수 없습니다.');
    return AdminWebhookConfigResponseDto.parseEntity(entity);
  }
}
