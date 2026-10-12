import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { ServiceSystemConfigCode } from '@pkg/shared/constants';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { InternalClient } from '#/core/http/internal-client';
import { SyncSystemConfigCommand } from '#/modules/service-config/sync-system-config.command';
import { SyncSystemConfigResponseDto } from '#/modules/service-config/sync-system-config.response.dto';
import { AdminWebhookConfigResponseDto } from '#/modules/system-config/webhook/admin-webhook-config.response.dto';

@Injectable()
@CommandHandler(SyncSystemConfigCommand)
export class SyncSystemConfigHandler implements ICommandHandler<SyncSystemConfigCommand, SyncSystemConfigResponseDto> {
  constructor(private readonly em: AppEntityManager,
    private readonly internalClient: InternalClient,
  ) {}

  async execute(_command: SyncSystemConfigCommand): Promise<SyncSystemConfigResponseDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.WEBHOOK }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 웹훅 설정을 찾을 수 없습니다.');
    const webhook = AdminWebhookConfigResponseDto.parseEntity(entity);
    await this.internalClient.fetch<ServiceSystemConfigCode[]>('/internal/system-configs', { method: 'PATCH', body: { webhook } });
    return SyncSystemConfigResponseDto.parse({ ok: true });
  }
}
