import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { VerifyEmailCommand } from '#/modules/auth/email-verification/verify-email.command';
import { VerifyEmailResponseDto } from '#/modules/auth/email-verification/verify-email.response.dto';

type EmailVerificationRecord = { userId: string, emailHash: string, token: string };

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kv: KvStore,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    const identity = await this.identify(command);
    const verified = await this.verify(identity);
    await this.process(verified);
    return VerifyEmailResponseDto.ok();
  }

  private async identify(command: VerifyEmailCommand): Promise<{ key: string, token: string, record: EmailVerificationRecord | null }> {
    const key = AuthKvStoreKey.emailVerificationChallenge(command.input.challengeId);
    return { key, token: command.input.token, record: await this.kv.get<EmailVerificationRecord>(key) };
  }

  private async verify(identity: { key: string, token: string, record: EmailVerificationRecord | null }): Promise<{ key: string, token: string, record: EmailVerificationRecord, user: User }> {
    const token = identity.token;
    if (!identity.record || !token || identity.record.token !== token) throw this.invalidEmailToken();

    const user = await this.em.findOne(User, {
      id: identity.record.userId,
      profile: { emailHash: identity.record.emailHash },
    }, { filters: false });
    if (!user || user.isDeleted) throw this.invalidEmailToken();
    return { key: identity.key, token, record: identity.record, user };
  }

  private async process(verified: { key: string, token: string, record: EmailVerificationRecord, user: User }): Promise<void> {
    const consumed = await this.kv.getAndDelete<EmailVerificationRecord>(verified.key);
    if (!consumed || consumed.token !== verified.token) throw this.invalidEmailToken();
    verified.user.emailVerified = true;
    await this.em.flush();
  }

  private invalidEmailToken(): ApplicationError {
    return new ApplicationError({ code: 'INVALID_EMAIL_VERIFICATION_TOKEN', status: HttpStatus.BAD_REQUEST });
  }
}
