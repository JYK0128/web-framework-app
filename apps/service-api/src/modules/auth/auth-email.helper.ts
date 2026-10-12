import { HttpStatus, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, isEncrypted } from '@pkg/shared/server';

import { SystemConfig } from '#/core/database/entities/system-configs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { MessageService } from '#/core/notification';
import { env } from '#/env';

type EmailConfig = { from?: string, smtp?: { host?: string, port?: number, secure?: boolean, user?: string, pass?: string } };

const logger = new Logger('EmailVerificationHelper');

export async function ensureEmailDeliveryConfigured(em: AppEntityManager): Promise<void> {
  serviceWebUrl('/verify-email');
  const config = await getEmailConfig(em);
  if (!hasEmailConfig(config)) {
    throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
}

export async function sendEmail(em: AppEntityManager, kv: KvStore, messages: MessageService, challengeKey: string, email: string, subject: string, text: string): Promise<void> {
  const config = await getEmailConfig(em);
  if (!hasEmailConfig(config)) {
    await kv.del(challengeKey);
    throw new ApplicationError({ code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
  try {
    await messages.send({ channel: 'email', message: { to: email, subject, text }, config });
  }
  catch (error) {
    // Failed delivery must not leave a usable unseen challenge.
    try {
      await kv.del(challengeKey);
    }
    catch (cleanupError) {
      logger.error(`Failed to remove email challenge after delivery failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
    if (error instanceof ApplicationError) throw error;
    throw ApplicationError.from(error, { code: 'EMAIL_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
  }
}

async function getEmailConfig(em: AppEntityManager): Promise<EmailConfig | null> {
  const entity = await em.findOne(SystemConfig, { code: 'delivery' }, { filters: false });
  if (typeof entity?.value !== 'object' || entity.value === null) return null;
  const config = (entity.value as { email?: EmailConfig }).email;
  if (!config?.smtp?.pass || !isEncrypted(config.smtp.pass)) return config ?? null;
  try {
    return { ...config, smtp: { ...config.smtp, pass: decrypt(config.smtp.pass, env.DELIVERY_EMAIL_ENCRYPTION_KEY) } };
  }
  catch (error) {
    throw ApplicationError.from(error, { code: 'EMAIL_DELIVERY_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
}

function hasEmailConfig(config: EmailConfig | null): config is EmailConfig & { from: string, smtp: { host: string, port: number, user: string, pass: string } } {
  return !!config?.from && !!config.smtp?.host && !!config.smtp.port && !!config.smtp.user && !!config.smtp.pass;
}

export function serviceWebUrl(path: string): URL {
  return new URL(path, env.APP_BASE_URL);
}
