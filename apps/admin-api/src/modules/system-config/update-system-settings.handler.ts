import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { ServiceSystemConfigCode } from '@pkg/shared/constants';

import { InternalClient } from '#/core/http/internal-client';
import { UpdateAdminEmailConfigCommand } from '#/modules/system-config/email/update-admin-email-config.command';
import { UpdateSystemConfigResponseDto } from '#/modules/system-config/update-system-config.response.dto';
import { UpdateSystemSettingsCommand } from '#/modules/system-config/update-system-settings.command';
import { UpdateAdminWebhookConfigCommand } from '#/modules/system-config/webhook/update-admin-webhook-config.command';

@Injectable()
@CommandHandler(UpdateSystemSettingsCommand)
export class UpdateSystemSettingsHandler implements ICommandHandler<UpdateSystemSettingsCommand, UpdateSystemConfigResponseDto> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly internalClient: InternalClient,
  ) {}

  async execute(command: UpdateSystemSettingsCommand): Promise<UpdateSystemConfigResponseDto> {
    const { adminEmail, webhook, ...serviceConfig } = command.input;
    if (adminEmail) await this.commandBus.execute(new UpdateAdminEmailConfigCommand(adminEmail));
    const updatedKeys = Object.keys(serviceConfig).length > 0 ? await this.internalClient.fetch<ServiceSystemConfigCode[]>('/internal/system-configs', { method: 'PATCH', body: serviceConfig }) : [];
    if (webhook) {
      const savedWebhook = await this.commandBus.execute(new UpdateAdminWebhookConfigCommand(webhook));
      await this.internalClient.fetch<ServiceSystemConfigCode[]>('/internal/system-configs', { method: 'PATCH', body: { webhook: savedWebhook } });
      updatedKeys.push('webhook');
    }
    return UpdateSystemConfigResponseDto.parse({ ok: true, updatedKeys });
  }
}
