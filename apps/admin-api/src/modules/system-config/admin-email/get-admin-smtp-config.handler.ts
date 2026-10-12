import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { AdminEmailConfigDto } from '#/modules/system-config/admin-email/admin-email-config.dto';
import { GetAdminSmtpConfigQuery } from '#/modules/system-config/admin-email/get-admin-smtp-config.query';

import { AdminSmtpConfigResponseDto } from './admin-smtp-config.response.dto';

@Injectable()
@QueryHandler(GetAdminSmtpConfigQuery)
export class GetAdminSmtpConfigHandler implements IQueryHandler<GetAdminSmtpConfigQuery, AdminSmtpConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<AdminSmtpConfigResponseDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
    const config = AdminEmailConfigDto.parseEntity(entity);
    if (!config.isConfigured()) throw new ApplicationError({ code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INCOMPLETE', status: HttpStatus.SERVICE_UNAVAILABLE });
    return AdminSmtpConfigResponseDto.parse({
      from: config.from,
      smtp: {
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        user: config.smtp.user,
        pass: decrypt(config.smtp.pass, env.ADMIN_EMAIL_ENCRYPTION_KEY),
      },
    }).validate();
  }
}
