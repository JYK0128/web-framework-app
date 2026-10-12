import { randomBytes, randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { TimeUtil } from '@pkg/shared/common';
import { encrypt, hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { EVENT_BROKER } from '#/core/event-broker/event-broker.interface';
import { EventBroker } from '#/core/event-broker/event-broker.service';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { env } from '#/env';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { EmailVerificationEvent } from '#/modules/auth/email-verification/email-verification.event';
import { RequestEmailVerificationCommand } from '#/modules/auth/email-verification/request-email-verification.command';
import { RequestEmailVerificationResponseDto } from '#/modules/auth/email-verification/request-email-verification.response.dto';
import { CheckAdminEmailConfigQuery } from '#/modules/system-config/admin-email/check-admin-email-config.query';

@Injectable()
@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<RequestEmailVerificationCommand, RequestEmailVerificationResponseDto> {
  private readonly logger = new Logger(RequestEmailVerificationHandler.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    @Inject(EVENT_BROKER.REDIS_STREAMS)
    private readonly eventBroker: EventBroker,
  ) {}

  async execute({ input }: RequestEmailVerificationCommand): Promise<RequestEmailVerificationResponseDto> {
    if (!SECURITY_CONFIG.registration.requireEmailVerification) return RequestEmailVerificationResponseDto.parse({ accepted: true });
    await this.queryBus.execute(new CheckAdminEmailConfigQuery());

    const email = input.email.trim().toLowerCase();
    const emailHash = hashWithSecret(email, env.PII_HASH_KEY);
    const user = await this.em.findOne(User, { profile: { emailHash } }, { filters: false });
    if (!user || user.isDeleted || user.emailVerified) return RequestEmailVerificationResponseDto.parse({ accepted: true });

    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const key = AuthKvStoreKey.emailVerificationChallenge(challengeId);
    const ttlMinutes = SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes;
    await this.kvStore.set(key, {
      userId: user.id,
      emailHash,
      emailEncrypted: encrypt(email, env.PII_ENCRYPTION_KEY),
      token,
    }, TimeUtil.s.minute(ttlMinutes));

    try {
      await this.eventBroker.publish(new EmailVerificationEvent(challengeId, ttlMinutes));
    }
    catch (error) {
      await this.removeChallenge(key);
      throw error;
    }
    return RequestEmailVerificationResponseDto.parse({ accepted: true });
  }

  private async removeChallenge(key: string): Promise<void> {
    try {
      await this.kvStore.del(key);
    }
    catch (error) {
      this.logger.error(`Failed to remove email verification challenge after event publication failure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
