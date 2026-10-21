import { Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { BrokerConsumer, EVENT_BROKER } from '@pkg/server-core/event-broker';
import { KvStore } from '@pkg/server-core/kv-store';
import { NotificationService } from '@pkg/server-core/notification';
import { decrypt } from '@pkg/shared/server';

import { SERVICE_ID } from '~/app.config';
import { env } from '~/env';
import { AuthKvStoreKey } from '~/modules/auth/auth.key';
import { EmailVerificationEvent } from '~/modules/auth/email-verification/email-verification.event';
import { SystemContext } from '~/modules/system-config/system.context';

type EmailVerificationRecord = { emailEncrypted: string, token: string };

@EventsHandler(EmailVerificationEvent)
@BrokerConsumer({ broker: EVENT_BROKER.REDIS_STREAMS, group: `${SERVICE_ID}-auth-email-notification` })
export class EmailVerificationHandler implements IEventHandler<EmailVerificationEvent> {
  private readonly logger = new Logger(EmailVerificationHandler.name);

  constructor(private readonly kvStore: KvStore, private readonly notifications: NotificationService, private readonly systemContext: SystemContext) {}

  async handle(event: EmailVerificationEvent): Promise<void> {
    const record = await this.kvStore.get<EmailVerificationRecord>(AuthKvStoreKey.emailVerificationChallenge(event.challengeId));
    if (!record) return;

    const verificationUrl = new URL('/verify-email', env.APP_BASE_URL);
    verificationUrl.searchParams.set('challengeId', event.challengeId);
    verificationUrl.searchParams.set('token', record.token);
    try {
      const config = (await this.systemContext.getNotificationConfig())?.email;
      await this.notifications.send({
        channel: 'email',
        message: {
          to: decrypt(record.emailEncrypted, env.PII_ENCRYPTION_KEY),
          subject: '이메일 주소 인증',
          text: `아래 링크에서 이메일 인증을 완료해 주세요. 링크는 ${event.ttlMinutes}분 동안 유효합니다.\n${verificationUrl.toString()}`,
        },
        config,
      });
    }
    catch (error) {
      this.logger.error(`Could not send email verification message for challenge ${event.challengeId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
