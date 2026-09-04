import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, jsonSafeParse, z } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { SessionContext } from '#/common/contexts/session.context';
import { type VerificationRecord, VerificationStore } from '#/common/stores/verification.store';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { VerifyEmailChangeCommand } from '#/modules/auth/commands/verify-email-change.command';
import type { VerifyEmailChangeResponseDto } from '#/modules/auth/dto/verify-email-change.response.dto';

const emailChangePayloadSchema = z.object({
  challengeId: z.string(),
  userId: z.string(),
  newEmail: z.email(),
  token: z.string(),
});

type EmailChangePayload = z.infer<typeof emailChangePayloadSchema>;

interface IdentifiedEmailChange {
  payload: EmailChangePayload
  verification: VerificationRecord
}

@Injectable()
@CommandHandler(VerifyEmailChangeCommand)
export class VerifyEmailChangeHandler implements ICommandHandler<VerifyEmailChangeCommand, VerifyEmailChangeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly sessionContext: SessionContext,
    private readonly verificationStore: VerificationStore,
  ) {}

  async execute(command: VerifyEmailChangeCommand): Promise<VerifyEmailChangeResponseDto> {
    const { challengeId, token } = command.input;
    const challenge = await this.identifyChallenge(challengeId);
    this.verifyToken(challenge, challengeId, token);

    const user = await this.identifyUser(challenge.payload.userId);
    await this.verifyEmailAvailable(challenge.payload.newEmail, user.id);

    return this.process(user, challenge);
  }

  private async identifyChallenge(challengeId: string): Promise<IdentifiedEmailChange> {
    const verification = await this.verificationStore.get(`email-change:${challengeId}`);
    if (!verification) {
      throw new ApplicationError({
        code: 'INVALID_EMAIL_CHALLENGE',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않거나 만료된 이메일 변경 링크입니다.',
      });
    }

    const rawJson = jsonSafeParse<unknown>(verification.value);
    const parsed = emailChangePayloadSchema.safeParse(rawJson);
    if (!parsed.success) {
      throw new ApplicationError({
        code: 'INVALID_EMAIL_CHALLENGE',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않은 이메일 변경 링크입니다.',
      });
    }
    return { payload: parsed.data, verification };
  }

  private verifyToken(challenge: IdentifiedEmailChange, challengeId: string, token: string): void {
    if (challenge.verification.expiresAt <= Date.now()) {
      throw new ApplicationError({
        code: 'EXPIRED_EMAIL_CHALLENGE',
        status: HttpStatus.BAD_REQUEST,
        message: '이메일 변경 링크의 유효시간(15분)이 만료되었습니다.',
      });
    }

    if (challenge.payload.challengeId !== challengeId || challenge.payload.token !== token.trim()) {
      throw new ApplicationError({
        code: 'INVALID_EMAIL_CHALLENGE',
        status: HttpStatus.BAD_REQUEST,
        message: '올바르지 않은 이메일 변경 토큰입니다.',
      });
    }
  }

  private async identifyUser(userId: string): Promise<User> {
    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private async verifyEmailAvailable(newEmail: string, userId: string): Promise<void> {
    const existing = await this.em.findOne(User, { email: newEmail, id: { $ne: userId } });
    if (existing) {
      throw new ApplicationError({
        code: 'EMAIL_ALREADY_REGISTERED',
        status: HttpStatus.CONFLICT,
        message: '이미 다른 계정에 등록된 이메일 주소입니다.',
      });
    }
  }

  private async process(user: User, challenge: IdentifiedEmailChange): Promise<VerifyEmailChangeResponseDto> {
    await this.verificationStore.consume(`email-change:${challenge.payload.challengeId}`);

    user.email = challenge.payload.newEmail;
    user.emailVerified = true;

    // Sync session if currently logged in as this user
    const currentSessionUser = this.requestContext.request?.session.user;
    if (currentSessionUser && currentSessionUser.id === user.id) {
      await this.sessionContext.establish({
        ...currentSessionUser,
        email: user.email,
        emailVerified: true,
      });
    }

    return {
      ok: true,
      email: user.email,
      emailVerified: true,
    };
  }
}
