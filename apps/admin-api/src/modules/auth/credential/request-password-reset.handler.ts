import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { EVENT_BROKER, EventBroker } from '@pkg/server-core/event-broker';
import { KvStore } from '@pkg/server-core/kv-store';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '~/app.config';
import { Account, User } from '~/core/database/entities/auth';
import { AppEntityManager } from '~/core/database/entity-manager';
import { env } from '~/env';
import { AuthKvStoreKey } from '~/modules/auth/auth.key';
import { PasswordResetEmailEvent } from '~/modules/auth/credential/password-reset-email.event';
import { RequestPasswordResetCommand } from '~/modules/auth/credential/request-password-reset.command';
import { RequestPasswordResetResponseDto } from '~/modules/auth/credential/request-password-reset.response.dto';
import { CheckAdminEmailConfigQuery } from '~/modules/system-config/admin-email/check-admin-email-config.query';

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand, RequestPasswordResetResponseDto> {
  private readonly logger = new Logger(RequestPasswordResetHandler.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    @Inject(EVENT_BROKER.REDIS_STREAMS) private readonly eventBroker: EventBroker,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<RequestPasswordResetResponseDto> {
    const identity = this.identify(command);
    const verified = await this.verify(identity);
    if (verified) await this.process(verified);
    return RequestPasswordResetResponseDto.parse({ accepted: true });
  }

  private identify(command: RequestPasswordResetCommand): { emailHash: string, phoneNumberHash: string } {
    const email = command.input.email.trim().toLowerCase();
    return {
      emailHash: hashWithSecret(email, env.PII_HASH_KEY),
      phoneNumberHash: hashWithSecret(command.input.phoneNumber, env.PII_HASH_KEY),
    };
  }

  private async verify(identity: { emailHash: string, phoneNumberHash: string }): Promise<{ user: User, profile: NonNullable<User['profile']> } | null> {
    if (!SECURITY_CONFIG.credentialAvailable) return null;
    await this.queryBus.execute(new CheckAdminEmailConfigQuery());

    const user = await this.em.findOne(User, {
      profile: { emailHash: identity.emailHash, phoneNumberHash: identity.phoneNumberHash },
    }, { populate: ['profile'], filters: false });
    if (!user || user.isDeleted) return null;
    const profile = user.profile;
    if (!profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });

    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account?.password) return null;
    return { user, profile };
  }

  private async process({ user, profile }: { user: User, profile: NonNullable<User['profile']> }): Promise<void> {
    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const key = AuthKvStoreKey.passwordResetChallenge(challengeId);
    await this.kvStore.set(key, {
      userId: user.id,
      emailHash: profile.emailHash,
      emailEncrypted: profile.emailEncrypted,
      token,
    }, TimeUtil.s.minute(SECURITY_CONFIG.token.passwordResetTokenTtlMinutes));

    try {
      await this.eventBroker.publish(new PasswordResetEmailEvent(challengeId));
    }
    catch (error) {
      await this.removeChallenge(key);
      throw error;
    }
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
