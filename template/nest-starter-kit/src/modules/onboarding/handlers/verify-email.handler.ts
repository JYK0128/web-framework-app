import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { type VerificationRecord, VerificationStore } from '#/common/stores/verification.store';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import type { EmailChallengePayload } from '#/modules/onboarding/commands/issue-email-challenge.command';
import { VerifyEmailCommand } from '#/modules/onboarding/commands/verify-email.command';
import type { VerifyEmailResponseDto } from '#/modules/onboarding/dto/verify-email.response.dto';

interface IdentifiedEmailChallenge {
  payload: EmailChallengePayload
  verification: VerificationRecord
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  private readonly logger = new Logger(VerifyEmailHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly verificationStore: VerificationStore,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    const user = await this.identifyUser();
    this.verifyNotVerified(user);

    const challenge = await this.identifyChallenge(user.id);
    this.verifyChallenge(challenge, user.email, command.input.challengeId, command.input.code);

    await this.process(user, challenge);

    return {
      ok: true,
      emailVerified: true,
    };
  }

  private async identifyUser(): Promise<User> {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    return user;
  }

  private verifyNotVerified(user: User): void {
    if (user.emailVerified) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_VERIFIED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyChallenge(userId: string): Promise<IdentifiedEmailChallenge> {
    const verification = await this.verificationStore.get(`email:${userId}`);
    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }

    try {
      const payload = JSON.parse(verification.value) as Partial<EmailChallengePayload>;
      if (
        typeof payload.challengeId !== 'string'
        || typeof payload.email !== 'string'
        || typeof payload.code !== 'string'
      ) {
        throw new Error('Invalid email challenge payload');
      }
      return { payload: payload as EmailChallengePayload, verification };
    }
    catch {
      throw new ApplicationError({ code: 'INVALID_EMAIL_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }
  }

  private verifyChallenge(
    challenge: IdentifiedEmailChallenge,
    email: string,
    challengeId: string,
    code: string,
  ): void {
    if (challenge.verification.expiresAt <= Date.now()) {
      throw new ApplicationError({ code: 'EXPIRED_EMAIL_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }

    if (
      challenge.payload.challengeId !== challengeId
      || challenge.payload.email !== email
      || challenge.payload.code !== code.trim()
    ) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(user: User, challenge: IdentifiedEmailChallenge): Promise<void> {
    const consumed = await this.verificationStore.consume(`email:${user.id}`);
    if (
      !consumed
      || consumed.value !== challenge.verification.value
      || consumed.expiresAt !== challenge.verification.expiresAt
    ) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }

    user.emailVerified = true;

    this.logger.log(`[Email Verification] User ${user.email} successfully verified email.`);
  }
}
