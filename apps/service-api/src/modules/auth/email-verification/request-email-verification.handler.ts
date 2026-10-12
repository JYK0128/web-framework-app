import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { MessageService } from '#/core/notification';
import { env } from '#/env';
import { ensureEmailNotificationConfigured } from '#/modules/auth/auth-email.helper';
import { sendEmailVerificationChallenge } from '#/modules/auth/email-verification/email-verification.helper';
import { RequestEmailVerificationCommand } from '#/modules/auth/email-verification/request-email-verification.command';
import { RequestEmailVerificationResponseDto } from '#/modules/auth/email-verification/request-email-verification.response.dto';

@Injectable()
@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<RequestEmailVerificationCommand, RequestEmailVerificationResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore, private readonly messages: MessageService) {}
  async execute(command: RequestEmailVerificationCommand): Promise<RequestEmailVerificationResponseDto> {
    if (!SECURITY_CONFIG.registration.requireEmailVerification) return RequestEmailVerificationResponseDto.parse({ accepted: true });
    await ensureEmailNotificationConfigured(this.em);
    const user = await this.em.findOne(User, { profile: { emailHash: hashWithSecret(command.input.email, env.PII_HASH_KEY) } }, { populate: ['profile'], filters: false });
    if (user && !user.isDeleted && !user.emailVerified) {
      if (!user.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      await sendEmailVerificationChallenge(this.em, this.kv, this.messages, user, user.profile, decrypt(user.profile.emailEncrypted, env.PII_ENCRYPTION_KEY));
    }
    return RequestEmailVerificationResponseDto.parse({ accepted: true });
  }
}
