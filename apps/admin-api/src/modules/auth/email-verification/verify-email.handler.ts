import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { VerifyEmailCommand } from '#/modules/auth/email-verification/verify-email.command';
import { VerifyEmailResponseDto } from '#/modules/auth/email-verification/verify-email.response.dto';

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
  ) {}

  async execute({ input }: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    const key = AuthKvStoreKey.emailVerificationChallenge(input.challengeId);
    const pending = await this.kvStore.get<{ userId: string, emailHash: string, token: string }>(key);
    if (!pending || pending.token !== input.token) throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
    const user = await this.em.findOne(User, { id: pending.userId, profile: { emailHash: pending.emailHash } }, { filters: false });
    if (!user || user.isDeleted) throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
    const consumed = await this.kvStore.getAndDelete<{ token: string }>(key);
    if (!consumed || consumed.token !== input.token) throw new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
    user.emailVerified = true;
    await this.em.flush();
    return VerifyEmailResponseDto.ok();
  }
}
