import { Injectable } from '@nestjs/common';
import type { EmailConfigDto } from '@pkg/shared/server';
import { createTransport } from 'nodemailer';

import type { DeliveryResult, EmailAdapter, EmailMessage } from '#/infra/delivery/delivery.interface';

type SmtpConfig = Partial<EmailConfigDto>;

@Injectable()
export class SmtpAdapter implements EmailAdapter {
  async send(message: EmailMessage, rawProviderConfig: unknown): Promise<DeliveryResult> {
    const providerConfig = rawProviderConfig as SmtpConfig | undefined;
    const smtp = providerConfig?.smtp;
    if (!providerConfig?.from || !smtp?.host || !smtp.port || !smtp.user || !smtp.pass) {
      return { success: false, error: 'SMTP 발송 설정이 완전하지 않습니다.' };
    }

    try {
      const transporter = createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.pass },
      });
      const info = await transporter.sendMail({ ...message, from: providerConfig.from });
      return { success: true, messageId: info.messageId };
    }
    catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'SMTP 발송에 실패했습니다.' };
    }
  }
}
