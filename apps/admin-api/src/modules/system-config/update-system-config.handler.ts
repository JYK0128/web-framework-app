import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt } from '@pkg/shared/server';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { InternalClient } from '#/core/internal-client';
import { SystemContext } from '#/core/system.context';
import { env } from '#/env';
import { AdminEmailConfigDto } from '#/modules/system-config/admin-email/admin-email-config.dto';
import { UpdateSystemConfigCommand } from '#/modules/system-config/update-system-config.command';
import { UpdateSystemConfigResponseDto } from '#/modules/system-config/update-system-config.response.dto';
import { WebhookConfigDto } from '#/modules/system-config/webhook/webhook-config.dto';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly internalClient: InternalClient,
    private readonly systemContext: SystemContext,
  ) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const { adminEmail, webhook, ...serviceConfig } = command.input;
    const updatedKeys: string[] = [];
    if (adminEmail || webhook) {
      await this.em.transactional(async (em) => {
        if (adminEmail) {
          const entity = await em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false });
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
        }
        if (webhook) {
          const entity = await em.findOne(SystemConfig, { code: AdminSystemConfigCode.WEBHOOK }, { filters: false });
          if (!entity) throw new NotFoundException('Admin 웹훅 설정을 찾을 수 없습니다.');
          entity.value = WebhookConfigDto.parse(webhook).validate();
        }
      });
      this.systemContext.invalidateCache();
      if (adminEmail) updatedKeys.push('adminEmail');
      if (webhook) updatedKeys.push('webhook');
    }

    const remoteConfig = { ...serviceConfig };
    const remoteKeys = Object.keys(remoteConfig);
    if (remoteKeys.length > 0) {
      try {
        const remoteUpdatedKeys = await this.internalClient.fetch<string[]>('/internal/system-config', { method: 'PATCH', body: remoteConfig });
        updatedKeys.push(...remoteUpdatedKeys.filter((key) => !updatedKeys.includes(key)));
      }
      catch (cause) {
        const unconfirmedKeys = remoteKeys.filter((key) => !updatedKeys.includes(key));
        const error = new ApplicationError({
          code: 'SYSTEM_CONFIG_UPDATE_INCOMPLETE',
          status: HttpStatus.SERVICE_UNAVAILABLE,
          details: UpdateSystemConfigResponseDto.toPlain(UpdateSystemConfigResponseDto.parse({ ok: false, updatedKeys, syncedKeys: [], unconfirmedKeys })),
        });
        error.cause = cause;
        throw error;
      }
    }
    return UpdateSystemConfigResponseDto.parse({ ok: true, updatedKeys, syncedKeys: [], unconfirmedKeys: [] });
  }
}
