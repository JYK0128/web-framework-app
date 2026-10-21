import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EVENT_BROKER, EventBroker } from '@pkg/server-core/event-broker';
import { KvStore } from '@pkg/server-core/kv-store';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '~/app.config';
import { User } from '~/core/database/entities/auth';
import { AppEntityManager } from '~/core/database/entity-manager';
import { env } from '~/env';
import { AuthKvStoreKey } from '~/modules/auth/auth.key';
import { EmailVerificationEvent } from '~/modules/auth/email-verification/email-verification.event';
import { RequestEmailVerificationCommand } from '~/modules/auth/email-verification/request-email-verification.command';
import { RequestEmailVerificationResponseDto } from '~/modules/auth/email-verification/request-email-verification.response.dto';
import { ensureEmailNotificationConfigured } from '~/modules/system-config/notification/service-email-config.helper';
import { SystemContext } from '~/modules/system-config/system.context';

@Injectable()
@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<RequestEmailVerificationCommand, RequestEmailVerificationResponseDto> {
  private readonly logger = new Logger(RequestEmailVerificationHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly kv: KvStore,
    private readonly systemContext: SystemContext,
    @Inject(EVENT_BROKER.REDIS_STREAMS) private readonly eventBroker: EventBroker,
  ) {}

  async execute(command: RequestEmailVerificationCommand): Promise<RequestEmailVerificationResponseDto> {
    const identity = this.identify(command);
    const user = await this.verify(identity);
    if (user) await this.process(user);
    return RequestEmailVerificationResponseDto.parse({ accepted: true });
  }

  private identify(command: RequestEmailVerificationCommand): { emailHash: string } {
    return { emailHash: hashWithSecret(command.input.email.trim().toLowerCase(), env.PII_HASH_KEY) };
  }

  private async verify(identity: { emailHash: string }): Promise<{ user: User, profile: NonNullable<User['profile']> } | null> {
    if (!SECURITY_CONFIG.registration.requireEmailVerification) return null;
    await ensureEmailNotificationConfigured(this.systemContext);

    const user = await this.em.findOne(User, { profile: { emailHash: identity.emailHash } }, { populate: ['profile'], filters: false });
    if (!user || user.isDeleted || user.emailVerified) return null;
    const profile = user.profile;
    if (!profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return { user, profile };
  }

  private async process({ user, profile }: { user: User, profile: NonNullable<User['profile']> }): Promise<void> {
    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const ttlMinutes = SECURITY_CONFIG.registration.emailVerificationTokenTtlMinutes;
    const key = AuthKvStoreKey.emailVerificationChallenge(challengeId);
    await this.kv.set(key, {
      userId: user.id,
      emailHash: profile.emailHash,
      emailEncrypted: profile.emailEncrypted,
      token,
    }, TimeUtil.s.minute(ttlMinutes));

    try {
      await this.eventBroker.publish(new EmailVerificationEvent(challengeId, ttlMinutes));
    }
    catch (error) {
      await this.removeChallenge(key);
      throw error;
    }
  }

  private async removeChallenge(key: string): Promise<void> {
    try {
      await this.kv.del(key);
    }
    catch (error) {
      this.logger.error(`Failed to remove email challenge after event publication failure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
