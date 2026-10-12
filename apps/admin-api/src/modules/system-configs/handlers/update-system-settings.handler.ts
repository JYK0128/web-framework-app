import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AdminEmailConfigService } from '#/modules/system-configs/admin-email-config.service';
import { AdminWebhookConfigService } from '#/modules/system-configs/admin-webhook-config.service';
import { UpdateSystemSettingsCommand } from '#/modules/system-configs/commands';
import type { UpdateSystemConfigResponseDto } from '#/modules/system-configs/dto/update-system-config.response.dto';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

@Injectable()
@CommandHandler(UpdateSystemSettingsCommand)
export class UpdateSystemSettingsHandler implements ICommandHandler<UpdateSystemSettingsCommand, UpdateSystemConfigResponseDto> {
  constructor(
    private readonly service: ServiceSystemConfigClient,
    private readonly adminEmailService: AdminEmailConfigService,
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
