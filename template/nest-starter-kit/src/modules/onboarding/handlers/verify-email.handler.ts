import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, jsonSafeParse, z } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { type VerificationRecord, VerificationStore } from '#/common/stores/verification.store';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { VerifyEmailCommand } from '#/modules/onboarding/commands/verify-email.command';
import type { VerifyEmailResponseDto } from '#/modules/onboarding/dto/verify-email.response.dto';

const storedChallengePayloadSchema = z.object({
  challengeId: z.string(),
  userId: z.string().optional(),
  email: z.string(),
  code: z.string(),
});

type StoredChallengePayload = z.infer<typeof storedChallengePayloadSchema>;

interface IdentifiedEmailChallenge {
  payload: StoredChallengePayload
  verification: VerificationRecord
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
    private readonly verificationStore: VerificationStore,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    const { challengeId, code } = command.input;

    const challenge = await this.identifyChallenge(challengeId);
    const user = await this.identifyUser(challenge.payload.userId);
    this.verify(user, challenge, challengeId, code);

    await this.process(user, challenge);

    return {
      ok: true,
      emailVerified: true,
    };
  }

  private async identifyChallenge(challengeId: string): Promise<IdentifiedEmailChallenge> {
    let verification = await this.verificationStore.get(`email:challenge:${challengeId}`);
    if (!verification) {
      const sessionUser = this.sessionContext.user;
      if (sessionUser) {
        verification = await this.verificationStore.get(`email:${sessionUser.id}`);
      }
    }

    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }

    const rawJson = jsonSafeParse<unknown>(verification.value);
    const parsed = storedChallengePayloadSchema.safeParse(rawJson);
    if (!parsed.success) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }
    return { payload: parsed.data, verification };
  }

  private async identifyUser(userIdFromPayload?: string): Promise<User> {
    const sessionUserId = this.sessionContext.user?.id;
    const targetUserId = userIdFromPayload || sessionUserId;

    if (!targetUserId) {
      throw new ApplicationError({ code: 'INVALID_EMAIL_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }

    const user = await this.em.findOne(User, { id: targetUserId });
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

  private verify(
    user: User,
    challenge: IdentifiedEmailChallenge,
    challengeId: string,
    code: string,
  ): void {
    this.verifyNotVerified(user);
    this.verifyChallenge(challenge, user.email, challengeId, code);
  }

  private async process(user: User, challenge: IdentifiedEmailChallenge): Promise<void> {
    await this.verificationStore.consume(`email:challenge:${challenge.payload.challengeId}`);
    await this.verificationStore.consume(`email:${user.id}`);

    user.emailVerified = true;

    const sessionUser = this.sessionContext.user;
    if (sessionUser?.id === user.id) {
      sessionUser.emailVerified = true;
    }
  }
}
