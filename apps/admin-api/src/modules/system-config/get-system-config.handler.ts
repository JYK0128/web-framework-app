import { Injectable, NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { InternalClient } from '#/core/http/internal-client';
import type { ServiceSystemConfigResponseDto } from '#/modules/system-config/service-system-config.response.dto';

import { AdminEmailConfigResponseDto } from './admin-email/admin-email-config.response.dto';
import { GetSystemConfigQuery } from './get-system-config.query';
import { SystemConfigResponseDto } from './system-config.response.dto';
import { AdminWebhookConfigResponseDto } from './webhook/admin-webhook-config.response.dto';

@Injectable()
@QueryHandler(GetSystemConfigQuery)
export class GetSystemConfigHandler implements IQueryHandler<GetSystemConfigQuery, SystemConfigResponseDto> {
  constructor(private readonly internalClient: InternalClient, private readonly em: AppEntityManager) {}

  async execute(): Promise<SystemConfigResponseDto> {
    const [config, emailEntity, webhookEntity] = await Promise.all([
      this.internalClient.fetch<ServiceSystemConfigResponseDto>('/internal/system-config'),
      this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false }),
      this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.WEBHOOK }, { filters: false }),
    ]);
    if (!emailEntity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
    if (!webhookEntity) throw new NotFoundException('Admin 웹훅 설정을 찾을 수 없습니다.');
    return SystemConfigResponseDto.parse({
      notification: config.notification,
      oauth: config.oauth,
      webhook: AdminWebhookConfigResponseDto.parseEntity(webhookEntity),
      adminEmail: AdminEmailConfigResponseDto.parseEntity(emailEntity),
    });
  }
}
