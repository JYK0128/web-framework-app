import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { addMinutes } from 'date-fns';

import { RequestContext } from '#/common/contexts/request.context';
import { VerificationStore } from '#/common/stores/verification.store';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { type EmailChallengePayload, IssueEmailChallengeCommand, type IssueEmailChallengeResult } from '#/modules/onboarding/commands/issue-email-challenge.command';

const EMAIL_CHALLENGE_EXPIRY_MINUTES = 15;

@Injectable()
@CommandHandler(IssueEmailChallengeCommand)
export class IssueEmailChallengeHandler implements ICommandHandler<IssueEmailChallengeCommand, IssueEmailChallengeResult> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly verificationStore: VerificationStore,
  ) {}

  async execute(_command: IssueEmailChallengeCommand): Promise<IssueEmailChallengeResult> {
    const user = await this.identifyUser();
    this.verifyNotVerified(user);

    return this.process(user);
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

  private async process(user: User): Promise<IssueEmailChallengeResult> {
    const challengeId = randomUUID();
    const code = randomBytes(32).toString('base64url');
    const payload: EmailChallengePayload = { challengeId, email: user.email, code };

    await this.verificationStore.save(`email:${user.id}`, {
      value: JSON.stringify(payload),
      expiresAt: addMinutes(new Date(), EMAIL_CHALLENGE_EXPIRY_MINUTES).getTime(),
    });

    return {
      ok: true,
      challengeId,
      expiresIn: EMAIL_CHALLENGE_EXPIRY_MINUTES * 60,
      email: user.email,
      code,
    };
  }
}
