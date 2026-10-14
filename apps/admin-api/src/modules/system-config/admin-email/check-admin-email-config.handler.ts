import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/core/system.context';
import { AdminEmailConfigDto } from '#/modules/system-config/admin-email/admin-email-config.dto';
import { CheckAdminEmailConfigQuery } from '#/modules/system-config/admin-email/check-admin-email-config.query';
import { CheckAdminEmailConfigResponseDto } from '#/modules/system-config/admin-email/check-admin-email-config.response.dto';

@Injectable()
@QueryHandler(CheckAdminEmailConfigQuery)
export class CheckAdminEmailConfigHandler implements IQueryHandler<CheckAdminEmailConfigQuery, CheckAdminEmailConfigResponseDto> {
  constructor(private readonly systemContext: SystemContext) {}

  async execute(): Promise<CheckAdminEmailConfigResponseDto> {
    const { adminEmail } = await this.systemContext.getConfig();
    if (!AdminEmailConfigDto.parse(adminEmail).isConfigured()) throw new ApplicationError({ code: 'EMAIL_NOTIFICATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    return CheckAdminEmailConfigResponseDto.parse({ ok: true });
  }
}
