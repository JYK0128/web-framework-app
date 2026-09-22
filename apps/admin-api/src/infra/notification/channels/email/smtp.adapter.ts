import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';

import type { EmailAdapter, EmailMessage, NotificationResult } from '#/infra/notification/notification.interface';

type SmtpConfig = {
  from?: string
  smtp?: {
    host?: string
    port?: number
    secure?: boolean
    user?: string
    pass?: string
  }
};

@Injectable()
export class SmtpAdapter implements EmailAdapter {
  async send(message: EmailMessage, rawConfig: unknown): Promise<NotificationResult> {
    const config = rawConfig as SmtpConfig | undefined;
    const smtp = config?.smtp;
    if (!config?.from || !smtp?.host || !smtp.port || !smtp.user || !smtp.pass) {
      return { success: false, error: 'SMTP 발송 설정이 완전하지 않습니다.' };
    }

    try {
      const transporter = createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.pass },
      });
      const info = await transporter.sendMail({ ...message, from: config.from });
      return { success: true, messageId: info.messageId };
    }
    catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'SMTP 발송에 실패했습니다.' };
    }
  }
}
