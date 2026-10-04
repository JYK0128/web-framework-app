import { Injectable } from '@nestjs/common';
import { z } from '@pkg/shared/common';

import { AdminSystemConfigCode, SystemConfig } from '#/entities/system-configs/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { WebhookConfigDto } from './dto/webhook/webhook-config.dto';
import { ServiceSystemConfigClient } from './service-system-config.client';

const WEBHOOK_CONFIG_SCHEMA = z.object({
  enabled: z.boolean(),
  type: z.enum(['SLACK', 'DISCORD', 'CHANNEL_TALK', 'TEAMS']),
  cooldownMinutes: z.number().int().min(1).max(1440),
  webhookUrl: z.string(),
}).superRefine((config, ctx) => {
  if (!config.enabled) return;
  try {
    const url = new URL(config.webhookUrl.trim());
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
  }
  catch {
    ctx.addIssue({ code: 'custom', path: ['webhookUrl'], message: '활성화된 웹훅은 올바른 HTTP 또는 HTTPS URL이 필요합니다.' });
  }
});

@Injectable()
export class AdminWebhookConfigService {
  constructor(
    private readonly em: AppEntityManager,
    private readonly serviceConfigClient: ServiceSystemConfigClient,
  ) {}

  async getResponse(): Promise<WebhookConfigDto> {
    const entity = await this.getEntity();
    return Object.assign(new WebhookConfigDto(), WEBHOOK_CONFIG_SCHEMA.parse(entity.value));
  }

  async update(input: WebhookConfigDto): Promise<WebhookConfigDto> {
    const entity = await this.getEntity();
    entity.value = WEBHOOK_CONFIG_SCHEMA.parse(input);
    await this.em.flush();
    return this.getResponse();
  }

  private async getEntity(): Promise<SystemConfig> {
    let entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.WEBHOOK }, { filters: false });
    if (entity) return entity;

    // One-time migration from the previous Service API-owned webhook row.
    const legacyConfig = await this.serviceConfigClient.getResponse();
    const value = WEBHOOK_CONFIG_SCHEMA.parse(legacyConfig.webhook);
    entity = this.em.create(SystemConfig, {
      code: AdminSystemConfigCode.WEBHOOK,
      value,
      description: '문의 운영자 알림 웹훅 설정',
    });
    this.em.persist(entity);
    await this.em.flush();
    return entity;
  }
}
