import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { InternalClient } from '#/core/http/internal-client';
import { AdminWebhookConfigResponseDto } from '#/modules/system-config/webhook/admin-webhook-config.response.dto';

import { SyncWebhookConfigCommand } from './sync-webhook-config.command';
import { SyncWebhookConfigResponseDto } from './sync-webhook-config.response.dto';

@Injectable()
@CommandHandler(SyncWebhookConfigCommand)
export class SyncWebhookConfigHandler implements ICommandHandler<SyncWebhookConfigCommand, SyncWebhookConfigResponseDto> {
  constructor(private readonly em: AppEntityManager,
    private readonly internalClient: InternalClient,
  ) {}

  async execute(_command: SyncWebhookConfigCommand): Promise<SyncWebhookConfigResponseDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.WEBHOOK }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 웹훅 설정을 찾을 수 없습니다.');
    const webhook = AdminWebhookConfigResponseDto.parseEntity(entity);
    await this.internalClient.fetch<string[]>('/internal/system-config', { method: 'PATCH', body: { webhook } });
    return SyncWebhookConfigResponseDto.parse({ ok: true });
  }
}
