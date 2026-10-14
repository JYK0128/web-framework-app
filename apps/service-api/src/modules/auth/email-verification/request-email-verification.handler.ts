import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EVENT_BROKER } from '@pkg/server-core/event-broker/event-broker.interface';
import { EventBroker } from '@pkg/server-core/event-broker/event-broker.service';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { ensureEmailNotificationConfigured } from '#/modules/system-config/notification/service-email-config.helper';
import { sendEmailVerificationChallenge } from '#/modules/auth/email-verification/email-verification.helper';
import { RequestEmailVerificationCommand } from '#/modules/auth/email-verification/request-email-verification.command';
import { RequestEmailVerificationResponseDto } from '#/modules/auth/email-verification/request-email-verification.response.dto';
import { SystemContext } from '#/modules/system-config/system.context';

@Injectable()
@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<RequestEmailVerificationCommand, RequestEmailVerificationResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kv: KvStore,
    private readonly systemContext: SystemContext,
    @Inject(EVENT_BROKER.REDIS_STREAMS) private readonly eventBroker: EventBroker,
  ) {}
  async execute(command: RequestEmailVerificationCommand): Promise<RequestEmailVerificationResponseDto> {
    if (!SECURITY_CONFIG.registration.requireEmailVerification) return RequestEmailVerificationResponseDto.parse({ accepted: true });
    await ensureEmailNotificationConfigured(this.systemContext);
    const user = await this.em.findOne(User, { profile: { emailHash: hashWithSecret(command.input.email, env.PII_HASH_KEY) } }, { populate: ['profile'], filters: false });
    if (user && !user.isDeleted && !user.emailVerified) {
      if (!user.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      await sendEmailVerificationChallenge(this.eventBroker, this.kv, user, user.profile, decrypt(user.profile.emailEncrypted, env.PII_ENCRYPTION_KEY));
    }
    return RequestEmailVerificationResponseDto.parse({ accepted: true });
  }
}
