import { Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { createTransport } from 'nodemailer';

import { SystemContext } from '#/common/contexts/system.context';
import type { EmailAdapterResult, EmailMessage, IEmailAdapter } from '#/infra/notification/channels/email/email.interface';
import type { NotificationConfigDto } from '#/modules/system-config/dto';

/**
 * 자체 SMTP 서버 / Nodemailer 연동 어댑터
 *
 * DB 기반 동적 설정을 사용하여 어드민 UI에서 변경한 SMTP 설정이 즉시 반영됩니다.
 * send() 호출 시 SystemContext에서 최신 notification 설정을 조회합니다.
 */
@Injectable()
export class SmtpEmailAdapter implements IEmailAdapter {
  readonly providerName = 'smtp';
  private readonly logger = new Logger(SmtpEmailAdapter.name);

  constructor(private readonly systemContext: SystemContext) {}

  async send(message: EmailMessage, overrideConfig?: NotificationConfigDto['email']): Promise<EmailAdapterResult> {
    const targetTo = typeof message.to === 'string' ? message.to : JSON.stringify(message.to);

    const config = await this.resolveSmtpConfig(overrideConfig);
    if (!config) {
      this.logger.warn(`SMTP configuration is missing in system settings. Cannot send email to ${targetTo}`);
      return {
        success: false,
        error: 'SMTP configuration is not set. Please configure SMTP in system settings.',
      };
    }

    const { from, host, port, secure, user, pass } = config;

    try {
      this.logger.log(`[SMTP] 이메일 발송 요청 (${targetTo})`);
      const transporter = createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          minVersion: 'TLSv1.2',
        },
      });

      const info = await transporter.sendMail({
        from,
        ...message,
      });

      this.logger.log(`[SMTP] 이메일 발송 성공 (${targetTo}, messageId: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
      };
    }
    catch (error) {
      const errMsg = ApplicationError.from(error, 'EMAIL_SEND_FAILED').message;
      this.logger.error(`[SMTP] 이메일 발송 실패 (${targetTo}): ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }

  private async resolveSmtpConfig(overrideConfig?: NotificationConfigDto['email']) {
    const savedConfig = await this.systemContext.getConfig<NotificationConfigDto>('notification');
    const emailConfig = overrideConfig || savedConfig?.email;
    const smtp = emailConfig?.smtp;
    const pass = smtp?.pass || savedConfig?.email?.smtp?.pass;

    if (!smtp?.host || !smtp.port || !smtp.user || !pass) {
      return null;
    }

    return {
      from: emailConfig?.from ?? '',
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure ?? false,
      user: smtp.user,
      pass,
    };
  }
}
