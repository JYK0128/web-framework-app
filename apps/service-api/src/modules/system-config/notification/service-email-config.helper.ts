import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/modules/system-config/system.context';

type EmailConfig = { from?: string, smtp?: { host?: string, port?: number, secure?: boolean, user?: string, pass?: string } };

export async function ensureEmailNotificationConfigured(systemContext: SystemContext): Promise<void> {
  const config: unknown = (await systemContext.getNotificationConfig())?.email;
  if (!hasEmailConfig(config)) {
    throw new ApplicationError({ code: 'EMAIL_NOTIFICATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
  }
}

function hasEmailConfig(config: unknown): config is EmailConfig & { from: string, smtp: { host: string, port: number, user: string, pass: string } } {
  if (!config || typeof config !== 'object') return false;
  const email = config as EmailConfig;
  return typeof email.from === 'string'
    && typeof email.smtp?.host === 'string'
    && typeof email.smtp.port === 'number'
    && typeof email.smtp.user === 'string'
    && typeof email.smtp.pass === 'string';
}
