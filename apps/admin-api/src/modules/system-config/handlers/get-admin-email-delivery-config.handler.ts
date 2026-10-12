import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, type EmailConfigDto } from '@pkg/shared/server';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { AdminEmailConfigDto } from '#/modules/system-config/dto/admin-email/admin-email-config.dto';
import { GetAdminEmailDeliveryConfigQuery } from '#/modules/system-config/queries/get-admin-email-delivery-config.query';

@Injectable()
@QueryHandler(GetAdminEmailDeliveryConfigQuery)
export class GetAdminEmailDeliveryConfigHandler implements IQueryHandler<GetAdminEmailDeliveryConfigQuery, EmailConfigDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<EmailConfigDto> {
    const entity = await this.em.findOne(SystemConfig, { code: AdminSystemConfigCode.EMAIL }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
    const config = AdminEmailConfigDto.parseEntity(entity);
    if (!config.isConfigured()) throw new ApplicationError({ code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INCOMPLETE', status: HttpStatus.SERVICE_UNAVAILABLE });
    return { ...config, smtp: { ...config.smtp, pass: decrypt(config.smtp.pass, env.ADMIN_EMAIL_ENCRYPTION_KEY) } };
  }
}
