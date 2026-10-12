import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { AdminEmailConfigDto } from '#/modules/system-config/email/admin-email-config.dto';
import { EnsureAdminEmailDeliveryConfiguredCommand } from '#/modules/system-config/email/ensure-admin-email-delivery-configured.command';

@Injectable()
@CommandHandler(EnsureAdminEmailDeliveryConfiguredCommand)
export class EnsureAdminEmailDeliveryConfiguredHandler implements ICommandHandler<EnsureAdminEmailDeliveryConfiguredCommand, void> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<void> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
    if (!AdminEmailConfigDto.parseEntity(entity).isConfigured()) throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
}
