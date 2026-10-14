import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { NotificationService } from '@pkg/server-core/notification/index';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Account, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { ensureEmailNotificationConfigured } from '#/modules/auth/auth-email.helper';
import { sendPasswordResetChallenge } from '#/modules/auth/credential/password-reset.helper';
import { RequestPasswordResetCommand } from '#/modules/auth/credential/request-password-reset.command';
import { RequestPasswordResetResponseDto } from '#/modules/auth/credential/request-password-reset.response.dto';
import { SystemContext } from '#/modules/system-configs/system.context';

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand, RequestPasswordResetResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore, private readonly messages: NotificationService, private readonly systemContext: SystemContext) {}

  async execute(command: RequestPasswordResetCommand): Promise<RequestPasswordResetResponseDto> {
    if (!SECURITY_CONFIG.credentialAvailable) return RequestPasswordResetResponseDto.parse({ accepted: true });
    await ensureEmailNotificationConfigured(this.systemContext);
    const email = command.input.email.trim().toLowerCase();
    const user = await this.em.findOne(User, { profile: { emailHash: hashWithSecret(email, env.PII_HASH_KEY), phoneNumberHash: hashWithSecret(command.input.phoneNumber, env.PII_HASH_KEY) } }, { populate: ['profile'], filters: false });
    if (user && !user.isDeleted) {
      if (!user.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
      if (account?.password) {
        await sendPasswordResetChallenge(this.systemContext, this.kv, this.messages, user, user.profile, decrypt(user.profile.emailEncrypted, env.PII_ENCRYPTION_KEY));
      }
    }
    return RequestPasswordResetResponseDto.parse({ accepted: true });
  }
}
