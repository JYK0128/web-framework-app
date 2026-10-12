import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import type { ServiceSystemConfigCode } from '@pkg/shared/constants';
import { encrypt } from '@pkg/shared/server';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { InternalClient } from '#/core/http/internal-client';
import { env } from '#/env';
import { UpdateSystemConfigCommand } from '#/modules/system-config/update-system-config.command';
import { UpdateSystemConfigResponseDto } from '#/modules/system-config/update-system-config.response.dto';

import { AdminEmailConfigDto } from './admin-email/admin-email-config.dto';
import { AdminWebhookConfigResponseDto } from './webhook/admin-webhook-config.response.dto';
import { WebhookConfigDto } from './webhook/webhook-config.dto';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly internalClient: InternalClient,
  ) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const { adminEmail, webhook, ...serviceConfig } = command.input;
    if (adminEmail) {
      const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false });
      if (!entity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
      const current = AdminEmailConfigDto.parseEntity(entity);
      const next = AdminEmailConfigDto.parse({
        from: adminEmail.from.trim(),
        smtp: {
          host: adminEmail.smtpHost.trim(),
          port: adminEmail.smtpPort,
          secure: adminEmail.smtpSecure,
          user: adminEmail.smtpUser.trim(),
          pass: adminEmail.smtpPassword?.length ? encrypt(adminEmail.smtpPassword, env.ADMIN_EMAIL_ENCRYPTION_KEY) : current.smtp.pass,
        },
      }).validate();
      if (!next.isConfigured()) {
        throw new ApplicationError({
          code: 'ADMIN_EMAIL_CONFIG_INCOMPLETE',
          status: HttpStatus.BAD_REQUEST,
        });
      }
      entity.value = next;
      await this.em.flush();
    }
    const updatedKeys = Object.keys(serviceConfig).length > 0 ? await this.internalClient.fetch<ServiceSystemConfigCode[]>('/internal/system-configs', { method: 'PATCH', body: serviceConfig }) : [];
    if (webhook) {
      const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.WEBHOOK }, { filters: false });
      if (!entity) throw new NotFoundException('Admin 웹훅 설정을 찾을 수 없습니다.');
      entity.value = WebhookConfigDto.parse(webhook).validate();
      await this.em.flush();
      const savedWebhook = AdminWebhookConfigResponseDto.parseEntity(entity);
      await this.internalClient.fetch<ServiceSystemConfigCode[]>('/internal/system-configs', { method: 'PATCH', body: { webhook: savedWebhook } });
      updatedKeys.push('webhook');
    }
    return UpdateSystemConfigResponseDto.parse({ ok: true, updatedKeys });
  }
}
