import { Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { BrokerConsumer, EVENT_BROKER } from '@pkg/server-core/event-broker';
import { KvStore } from '@pkg/server-core/kv-store';
import { NotificationService } from '@pkg/server-core/notification';
import { decrypt } from '@pkg/shared/server';

import { SECURITY_CONFIG, SERVICE_ID } from '~/app.config';
import { env } from '~/env';
import { AuthKvStoreKey } from '~/modules/auth/auth.key';
import { PasswordResetEmailEvent } from '~/modules/auth/credential/password-reset-email.event';
import { SystemContext } from '~/modules/system-config/system.context';

type PasswordResetRecord = { emailEncrypted: string, token: string };

@EventsHandler(PasswordResetEmailEvent)
@BrokerConsumer({ broker: EVENT_BROKER.REDIS_STREAMS, group: `${SERVICE_ID}-auth-email-notification` })
export class PasswordResetEmailHandler implements IEventHandler<PasswordResetEmailEvent> {
  private readonly logger = new Logger(PasswordResetEmailHandler.name);

  constructor(private readonly kvStore: KvStore, private readonly notifications: NotificationService, private readonly systemContext: SystemContext) {}

  async handle(event: PasswordResetEmailEvent): Promise<void> {
    const record = await this.kvStore.get<PasswordResetRecord>(AuthKvStoreKey.passwordResetChallenge(event.challengeId));
    if (!record) return;

    const resetUrl = new URL('/reset-password', env.APP_BASE_URL);
    resetUrl.searchParams.set('challengeId', event.challengeId);
    resetUrl.searchParams.set('token', record.token);
    try {
      const config = (await this.systemContext.getNotificationConfig())?.email;
      await this.notifications.send({
        channel: 'email',
        message: {
          to: decrypt(record.emailEncrypted, env.PII_ENCRYPTION_KEY),
          subject: '비밀번호 재설정',
          text: `아래 링크에서 비밀번호를 재설정해 주세요. 링크는 ${SECURITY_CONFIG.token.passwordResetTokenTtlMinutes}분 동안 유효합니다.\n${resetUrl.toString()}`,
        },
        config,
      });
    }
    catch (error) {
      this.logger.error(`Could not send password reset message for challenge ${event.challengeId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
