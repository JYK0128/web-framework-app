import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt } from '@pkg/shared/server';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { AdminEmailConfigDto } from '#/modules/system-config/email/admin-email-config.dto';
import { AdminEmailConfigResponseDto } from '#/modules/system-config/email/admin-email-config.response.dto';
import { UpdateAdminEmailConfigCommand } from '#/modules/system-config/email/update-admin-email-config.command';

@Injectable()
@CommandHandler(UpdateAdminEmailConfigCommand)
export class UpdateAdminEmailConfigHandler implements ICommandHandler<UpdateAdminEmailConfigCommand, AdminEmailConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateAdminEmailConfigCommand): Promise<AdminEmailConfigResponseDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
    const current = AdminEmailConfigDto.parseEntity(entity);
    const next = AdminEmailConfigDto.parse({
      from: command.input.from.trim(),
      smtp: {
        host: command.input.smtpHost.trim(),
        port: command.input.smtpPort,
        secure: command.input.smtpSecure,
        user: command.input.smtpUser.trim(),
        pass: command.input.smtpPassword?.length ? encrypt(command.input.smtpPassword, env.ADMIN_EMAIL_ENCRYPTION_KEY) : current.smtp.pass,
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
    return AdminEmailConfigResponseDto.parseEntity(entity);
  }
}
