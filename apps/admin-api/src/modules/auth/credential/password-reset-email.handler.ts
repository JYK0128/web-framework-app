import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { type IEventHandler, QueryBus } from '@nestjs/cqrs';
import { decrypt } from '@pkg/shared/server';

import { EVENT_BROKER } from '#/core/event-broker/event-broker.interface';
import { EventBroker } from '#/core/event-broker/event-broker.service';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { NotificationService } from '#/core/notification/notification.service';
import { env } from '#/env';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { PasswordResetEmailEvent } from '#/modules/auth/credential/password-reset-email.event';
import { GetAdminSmtpConfigQuery } from '#/modules/system-config/admin-email/get-admin-smtp-config.query';

type PasswordResetRecord = { emailEncrypted: string, token: string };

@Injectable()
export class PasswordResetEmailHandler implements IEventHandler<PasswordResetEmailEvent>, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PasswordResetEmailHandler.name);
  private unsubscribe?: () => Promise<void>;

  constructor(
    private readonly queryBus: QueryBus,
    @Inject(EVENT_BROKER.REDIS_STREAMS)
    private readonly eventBroker: EventBroker,
    private readonly kvStore: KvStore,
    private readonly notifications: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.unsubscribe = await this.eventBroker.subscribe<PasswordResetEmailEvent>(
      PasswordResetEmailEvent.name,
      (event) => this.handle(event),
      { group: 'admin-auth-email-delivery' },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.unsubscribe?.();
  }

  async handle(event: PasswordResetEmailEvent): Promise<void> {
    const record = await this.kvStore.get<PasswordResetRecord>(AuthKvStoreKey.passwordResetChallenge(event.challengeId));
    if (!record) return;

    const resetUrl = new URL('/reset-password', env.APP_BASE_URL);
    resetUrl.searchParams.set('challengeId', event.challengeId);
    resetUrl.searchParams.set('token', record.token);
    try {
      const config = await this.queryBus.execute(new GetAdminSmtpConfigQuery());
      await this.notifications.send({
        channel: 'email',
        message: {
          to: decrypt(record.emailEncrypted, env.PII_ENCRYPTION_KEY),
          subject: '[Admin] 비밀번호 재설정',
          text: `비밀번호 재설정 링크: ${resetUrl.toString()}`,
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
