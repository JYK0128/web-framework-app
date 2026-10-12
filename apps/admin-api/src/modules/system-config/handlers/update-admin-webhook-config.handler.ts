import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { UpdateAdminWebhookConfigCommand } from '#/modules/system-config/commands/update-admin-webhook-config.command';
import { AdminWebhookConfigResponseDto } from '#/modules/system-config/dto/webhook/admin-webhook-config.response.dto';
import { WebhookConfigDto } from '#/modules/system-config/dto/webhook/webhook-config.dto';

@Injectable()
@CommandHandler(UpdateAdminWebhookConfigCommand)
export class UpdateAdminWebhookConfigHandler implements ICommandHandler<UpdateAdminWebhookConfigCommand, AdminWebhookConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateAdminWebhookConfigCommand): Promise<AdminWebhookConfigResponseDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.WEBHOOK }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 웹훅 설정을 찾을 수 없습니다.');
    const value = WebhookConfigDto.parse(command.input).validate();
    entity.value = value;
    await this.em.flush();
    return AdminWebhookConfigResponseDto.parseEntity(entity);
  }
}
