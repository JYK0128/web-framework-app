import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationError, z } from '@pkg/shared/common';
import { decrypt, type EmailConfigDto, encrypt } from '@pkg/shared/server';

import { AdminSystemConfigCode, SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { AdminEmailConfigResponseDto } from '#/modules/system-configs/dto/admin-email/admin-email-config.response.dto';
import { UpdateAdminEmailConfigRequestDto } from '#/modules/system-configs/dto/admin-email/update-admin-email-config.request.dto';

const CONFIG_CODE = AdminSystemConfigCode.EMAIL;
const AdminEmailConfigSchema = z.object({
  from: z.string(),
  smtp: z.object({
    host: z.string(),
    port: z.number().int().min(1).max(65535),
    secure: z.boolean(),
    user: z.string(),
    pass: z.string(),
  }).strict(),
}).strict();

type AdminEmailConfigValue = z.infer<typeof AdminEmailConfigSchema>;

@Injectable()
export class AdminEmailConfigService {
  constructor(private readonly em: AppEntityManager) {}

  async getResponse(): Promise<AdminEmailConfigResponseDto> {
    const value = await this.getValue();
    return {
      from: value.from,
      smtpHost: value.smtp.host,
      smtpPort: value.smtp.port,
      smtpSecure: value.smtp.secure,
      smtpUser: value.smtp.user,
      smtpPasswordConfigured: value.smtp.pass.length > 0,
    };
  }

  async update(input: UpdateAdminEmailConfigRequestDto): Promise<AdminEmailConfigResponseDto> {
    const entity = await this.getEntity();
    const current = this.parseValue(entity.value);
    const next = AdminEmailConfigSchema.parse({
      from: input.from.trim(),
      smtp: {
        host: input.smtpHost.trim(),
        port: input.smtpPort,
        secure: input.smtpSecure,
        user: input.smtpUser.trim(),
        pass: input.smtpPassword?.length ? encrypt(input.smtpPassword, env.ADMIN_EMAIL_ENCRYPTION_KEY) : current.smtp.pass,
      },
    });
    if (!this.isConfigured(next)) {
      throw new ApplicationError({
        code: 'ADMIN_EMAIL_CONFIG_INCOMPLETE',
        status: HttpStatus.BAD_REQUEST,
      });
    }
    entity.value = next;
    await this.em.flush();
    return this.getResponse();
  }

  async ensureEmailDeliveryConfigured(): Promise<void> {
    if (!this.isConfigured(await this.getValue())) {
      throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    }
  }

  async getEmailDeliveryConfig(): Promise<EmailConfigDto> {
    const config = await this.getValue();
    if (!this.isConfigured(config)) {
      throw new ApplicationError({
        code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INCOMPLETE',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
    return { ...config, smtp: { ...config.smtp, pass: decrypt(config.smtp.pass, env.ADMIN_EMAIL_ENCRYPTION_KEY) } };
  }

  private isConfigured(config: AdminEmailConfigValue): boolean {
    return Boolean(config.smtp.host.trim() && config.smtp.user.trim() && config.smtp.pass && z.email().safeParse(config.from).success);
  }

  private async getValue(): Promise<AdminEmailConfigValue> {
    const entity = await this.getEntity();
    return this.parseValue(entity.value);
  }

  private async getEntity(): Promise<SystemConfig> {
    const entity = await this.em.findOne(SystemConfig, { code: CONFIG_CODE }, { filters: false });
    if (!entity) throw new NotFoundException('Admin 이메일 설정을 찾을 수 없습니다.');
    return entity;
  }

  private parseValue(value: unknown): AdminEmailConfigValue {
    const result = AdminEmailConfigSchema.safeParse(value);
    if (!result.success) {
      throw new ApplicationError({
        code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INVALID',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        details: result.error.issues,
      });
    }
    return result.data;
  }
}
