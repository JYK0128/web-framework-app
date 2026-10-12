import { randomBytes, randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { TimeUtil } from '@pkg/shared/common';
import { encrypt, hmac } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Account, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { EVENT_BROKER } from '#/core/event-broker/event-broker.interface';
import { EventBroker } from '#/core/event-broker/event-broker.service';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { env } from '#/env';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { RequestPasswordResetCommand } from '#/modules/auth/commands';
import { RequestPasswordResetResponseDto } from '#/modules/auth/dto';
import { PasswordResetEmailEvent } from '#/modules/auth/events';
import { AdminEmailConfigService } from '#/modules/system-configs/admin-email-config.service';

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand, RequestPasswordResetResponseDto> {
  private readonly logger = new Logger(RequestPasswordResetHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    private readonly emailConfig: AdminEmailConfigService,
    @Inject(EVENT_BROKER.REDIS_STREAMS)
    private readonly eventBroker: EventBroker,
  ) {}

  async execute({ input }: RequestPasswordResetCommand): Promise<RequestPasswordResetResponseDto> {
    if (!SECURITY_CONFIG.credentialAvailable) return RequestPasswordResetResponseDto.fromPlain({ accepted: true });
    await this.emailConfig.ensureEmailDeliveryConfigured();

    const email = input.email.trim().toLowerCase();
    const user = await this.em.findOne(User, {
      profile: { emailHash: hmac(email, env.PII_HASH_KEY), phoneNumberHash: hmac(input.phoneNumber, env.PII_HASH_KEY) },
    }, { filters: false });
    if (!user || user.isDeleted) return RequestPasswordResetResponseDto.fromPlain({ accepted: true });
    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account?.password) return RequestPasswordResetResponseDto.fromPlain({ accepted: true });

    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const key = AuthKvStoreKey.passwordResetChallenge(challengeId);
    await this.kvStore.set(key, {
      userId: user.id,
      emailHash: hmac(email, env.PII_HASH_KEY),
      emailEncrypted: encrypt(email, env.PII_ENCRYPTION_KEY),
      token,
    }, TimeUtil.s.minute(SECURITY_CONFIG.token.passwordResetTokenTtlMinutes));

    try {
      await this.eventBroker.publish(new PasswordResetEmailEvent(challengeId));
    }
    catch (error) {
      await this.removeChallenge(key);
      throw error;
    }
    return RequestPasswordResetResponseDto.fromPlain({ accepted: true });
  }

  private async removeChallenge(key: string): Promise<void> {
    try {
      await this.kvStore.del(key);
    }
    catch (error) {
      this.logger.error(`Failed to remove password reset challenge after event publication failure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
