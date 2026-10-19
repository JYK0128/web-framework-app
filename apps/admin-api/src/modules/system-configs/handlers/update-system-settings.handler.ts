import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AdminWebhookConfigService } from '#/modules/system-configs/admin-webhook-config.service';
import { UpdateSystemSettingsCommand } from '#/modules/system-configs/commands';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';
import type { UpdateSystemConfigResponseDto } from '#/modules/system-configs/system-config.interfaces';
import { SystemConfigService } from '#/modules/system-configs/system-config.service';

@Injectable()
@CommandHandler(UpdateSystemSettingsCommand)
export class UpdateSystemSettingsHandler implements ICommandHandler<UpdateSystemSettingsCommand, UpdateSystemConfigResponseDto> {
  constructor(
    private readonly service: ServiceSystemConfigClient,
    private readonly adminEmailService: SystemConfigService,
    private readonly adminWebhookConfigService: AdminWebhookConfigService,
  ) {}

  async execute(command: UpdateSystemSettingsCommand): Promise<UpdateSystemConfigResponseDto> {
    const { adminEmail, webhook, ...serviceConfig } = command.input;
    if (adminEmail) await this.adminEmailService.update(adminEmail);
    const updatedKeys = Object.keys(serviceConfig).length > 0 ? await this.service.update(serviceConfig) : [];
    if (webhook) {
      const savedWebhook = await this.adminWebhookConfigService.update(webhook);
      await this.service.update({ webhook: savedWebhook });
      updatedKeys.push('webhook');
    }
    return { ok: true, updatedKeys };
  }
}
