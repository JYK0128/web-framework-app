import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationError, TimeUtil, z } from '@pkg/shared/common';
import { decrypt, encrypt } from '@pkg/shared/server';
import { createTransport } from 'nodemailer';

import { SECURITY_CONFIG } from '#/app.config';
import { AdminSystemConfigCode, SystemConfig } from '#/entities/system-configs/system-config.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AdminEmailConfigResponseDto, UpdateAdminEmailConfigRequestDto } from '#/modules/system-configs/dto/admin-email/admin-email-config.dto';
import { TestAdminEmailResponseDto } from '#/modules/system-configs/dto/admin-email/test-email.dto';

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
export class SystemConfigService {
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
        message: 'SMTP 서버, 계정, 비밀번호 및 올바른 발신 이메일 주소를 모두 설정해 주세요.',
      });
    }
    entity.value = next;
    await this.em.flush();
    return this.getResponse();
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const config = await this.getValue();
    if (!this.isConfigured(config)) return;
    await this.send(config, to, '[Admin] 비밀번호 재설정', `비밀번호 재설정 링크: ${resetUrl}`);
  }

  async ensureEmailDeliveryConfigured(): Promise<void> {
    if (!this.isConfigured(await this.getValue())) {
      throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE, message: '관리자 이메일 발송 설정을 확인해 주세요.' });
    }
  }

  async sendEmailVerificationEmail(to: string, verificationUrl: string, ttlMinutes: number): Promise<void> {
    const config = await this.getValue();
    await this.send(config, to, '[Admin] 이메일 주소 인증', `아래 링크에서 관리자 이메일 인증을 완료해 주세요. 링크는 ${ttlMinutes}분 동안 유효합니다.\n${verificationUrl}`);
  }

  async sendTestEmail(to: string): Promise<TestAdminEmailResponseDto> {
    const config = await this.getValue();
    await this.send(config, to, '[Admin] SMTP 연결 테스트', 'Admin SMTP 릴레이 연결이 정상적으로 동작합니다.');
    return { sent: true, message: `${to} 주소로 테스트 메일을 발송했습니다.` };
  }

  private async send(config: AdminEmailConfigValue, to: string, subject: string, text: string): Promise<void> {
    if (!this.isConfigured(config)) {
      throw new ApplicationError({
        code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INCOMPLETE',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Admin 메일 릴레이 설정이 완전하지 않거나 비활성화되어 있습니다.',
      });
    }

    const transporter = createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: decrypt(config.smtp.pass, env.ADMIN_EMAIL_ENCRYPTION_KEY) },
      connectionTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.connectionTimeoutSeconds),
      greetingTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.greetingTimeoutSeconds),
      socketTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.socketTimeoutSeconds),
    });
    try {
      await transporter.sendMail({ from: config.from, to, subject, text });
    }
    finally {
      transporter.close();
    }
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
    if (!entity) throw new NotFoundException('Admin 운영 설정을 찾을 수 없습니다.');
    return entity;
  }

  private parseValue(value: unknown): AdminEmailConfigValue {
    const result = AdminEmailConfigSchema.safeParse(value);
    if (!result.success) {
      throw new ApplicationError({
        code: 'ACCOUNT_RECOVERY_EMAIL_CONFIG_INVALID',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Admin 운영 설정을 확인할 수 없습니다.',
        details: result.error.issues,
      });
    }
    return result.data;
  }
}
