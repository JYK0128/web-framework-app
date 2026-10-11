import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import type { EmailConfigDto } from '@pkg/shared/server';
import { createTransport } from 'nodemailer';

import { SECURITY_CONFIG } from '#/app.config';
import type { EmailAdapter, EmailMessage } from '#/core/notification/notification.interface';

type SmtpConfig = Partial<EmailConfigDto>;

@Injectable()
export class SmtpAdapter implements EmailAdapter {
  async send(message: EmailMessage, rawProviderConfig: unknown): Promise<string | undefined> {
    const providerConfig = rawProviderConfig as SmtpConfig | undefined;
    const smtp = providerConfig?.smtp;
    if (!providerConfig?.from || !smtp?.host || !smtp.port || !smtp.user || !smtp.pass) {
      throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `이메일: SMTP 발송 설정이 완전하지 않습니다.`, status: HttpStatus.BAD_GATEWAY });
    }

    let transporter: ReturnType<typeof createTransport> | undefined;
    try {
      transporter = createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.pass },
        connectionTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.connectionTimeoutSeconds),
        greetingTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.greetingTimeoutSeconds),
        socketTimeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.smtp.socketTimeoutSeconds),
      });
      const info = await transporter.sendMail({ ...message, from: providerConfig.from });
      return info.messageId;
    }
    catch (error) {
      throw ApplicationError.from(error, { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }
    finally {
      transporter?.close();
    }
  }
}
