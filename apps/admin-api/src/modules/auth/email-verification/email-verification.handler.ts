import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { type IEventHandler, QueryBus } from '@nestjs/cqrs';
import { decrypt } from '@pkg/shared/server';

import { EVENT_BROKER } from '#/core/event-broker/event-broker.interface';
import { EventBroker } from '#/core/event-broker/event-broker.service';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { NotificationService } from '#/core/notification/notification.service';
import { env } from '#/env';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { EmailVerificationEvent } from '#/modules/auth/email-verification/email-verification.event';
import { GetAdminSmtpConfigQuery } from '#/modules/system-config/admin-email/get-admin-smtp-config.query';

type EmailVerificationRecord = { emailEncrypted: string, token: string };

@Injectable()
export class EmailVerificationHandler implements IEventHandler<EmailVerificationEvent>, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailVerificationHandler.name);
  private unsubscribe?: () => Promise<void>;

  constructor(
    private readonly queryBus: QueryBus,
    @Inject(EVENT_BROKER.REDIS_STREAMS)
    private readonly eventBroker: EventBroker,
    private readonly kvStore: KvStore,
    private readonly notifications: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.unsubscribe = await this.eventBroker.subscribe<EmailVerificationEvent>(
      EmailVerificationEvent.name,
      (event) => this.handle(event),
      { group: 'admin-auth-email-notification' },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.unsubscribe?.();
  }

  async handle(event: EmailVerificationEvent): Promise<void> {
    const record = await this.kvStore.get<EmailVerificationRecord>(AuthKvStoreKey.emailVerificationChallenge(event.challengeId));
    if (!record) return;

    const verificationUrl = new URL('/verify-email', env.APP_BASE_URL);
    verificationUrl.searchParams.set('challengeId', event.challengeId);
    verificationUrl.searchParams.set('token', record.token);
    try {
      const config = await this.queryBus.execute(new GetAdminSmtpConfigQuery());
      await this.notifications.send({
        channel: 'email',
        message: {
          to: decrypt(record.emailEncrypted, env.PII_ENCRYPTION_KEY),
          subject: '[Admin] 이메일 주소 인증',
          text: `아래 링크에서 관리자 이메일 인증을 완료해 주세요. 링크는 ${event.ttlMinutes}분 동안 유효합니다.\n${verificationUrl.toString()}`,
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
