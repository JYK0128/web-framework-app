import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { SystemContext } from '#/core/system.context';
import { env } from '#/env';
import { AdminEmailConfigDto } from '#/modules/system-config/admin-email/admin-email-config.dto';
import { AdminSmtpConfigResponseDto } from '#/modules/system-config/admin-email/admin-smtp-config.response.dto';
import { GetAdminSmtpConfigQuery } from '#/modules/system-config/admin-email/get-admin-smtp-config.query';

@Injectable()
@QueryHandler(GetAdminSmtpConfigQuery)
export class GetAdminSmtpConfigHandler implements IQueryHandler<GetAdminSmtpConfigQuery, AdminSmtpConfigResponseDto> {
  constructor(private readonly systemContext: SystemContext) {}

  async execute(): Promise<AdminSmtpConfigResponseDto> {
    const { adminEmail } = await this.systemContext.getConfig();
    const config = AdminEmailConfigDto.parse(adminEmail);
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
