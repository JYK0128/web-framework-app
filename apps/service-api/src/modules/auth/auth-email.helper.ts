import { HttpStatus, Logger } from '@nestjs/common';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { NotificationService } from '@pkg/server-core/notification/index';
import { ApplicationError } from '@pkg/shared/common';

import { env } from '#/env';
import { SystemContext } from '#/modules/system-configs/system.context';

type EmailConfig = { from?: string, smtp?: { host?: string, port?: number, secure?: boolean, user?: string, pass?: string } };

const logger = new Logger('EmailVerificationHelper');

export async function ensureEmailNotificationConfigured(systemContext: SystemContext): Promise<void> {
  serviceWebUrl('/verify-email');
  const config = await getEmailConfig(systemContext);
  if (!hasEmailConfig(config)) {
    throw new ApplicationError({ code: 'EMAIL_NOTIFICATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
}

export async function sendEmail(systemContext: SystemContext, kv: KvStore, messages: NotificationService, challengeKey: string, email: string, subject: string, text: string): Promise<void> {
  const config = await getEmailConfig(systemContext);
  if (!hasEmailConfig(config)) {
    await kv.del(challengeKey);
    throw new ApplicationError({ code: 'EMAIL_NOTIFICATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
  try {
    await messages.send({ channel: 'email', message: { to: email, subject, text }, config });
  }
  catch (error) {
    // Failed notification must not leave a usable unseen challenge.
    try {
      await kv.del(challengeKey);
    }
    catch (cleanupError) {
      logger.error(`Failed to remove email challenge after notification failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
    if (error instanceof ApplicationError) throw error;
    throw ApplicationError.from(error, { code: 'EMAIL_NOTIFICATION_FAILED', status: HttpStatus.BAD_GATEWAY });
  }
}

async function getEmailConfig(systemContext: SystemContext): Promise<EmailConfig | null> {
  return (await systemContext.getNotificationConfig())?.email ?? null;
}

function hasEmailConfig(config: EmailConfig | null): config is EmailConfig & { from: string, smtp: { host: string, port: number, user: string, pass: string } } {
  return !!config?.from && !!config.smtp?.host && !!config.smtp.port && !!config.smtp.user && !!config.smtp.pass;
}

export function serviceWebUrl(path: string): URL {
  return new URL(path, env.APP_BASE_URL);
}
