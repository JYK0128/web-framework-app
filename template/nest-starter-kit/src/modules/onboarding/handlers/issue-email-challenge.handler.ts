import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { addMinutes } from 'date-fns';

import { RequestContext } from '#/common/contexts/request.context';
import { VerificationStore } from '#/common/stores/verification.store';
import { IssueEmailChallengeCommand, type IssueEmailChallengeResult } from '#/modules/onboarding/commands/issue-email-challenge.command';

const EMAIL_CHALLENGE_EXPIRY_MINUTES = 15;

@Injectable()
@CommandHandler(IssueEmailChallengeCommand)
export class IssueEmailChallengeHandler implements ICommandHandler<IssueEmailChallengeCommand, IssueEmailChallengeResult> {
  constructor(
    private readonly requestContext: RequestContext,
    private readonly verificationStore: VerificationStore,
  ) {}

  async execute(_command: IssueEmailChallengeCommand): Promise<IssueEmailChallengeResult> {
    const sessionUser = this.identifySessionUser();
    return this.process(sessionUser.id, sessionUser.email);
  }

  private identifySessionUser() {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    if (sessionUser.emailVerified) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_VERIFIED', status: HttpStatus.BAD_REQUEST });
    }
    return sessionUser;
  }

  private async process(userId: string, email: string): Promise<IssueEmailChallengeResult> {
    const challengeId = randomUUID();
    const code = randomBytes(32).toString('base64url');
    const payload = { challengeId, userId, email, code };
    const expiresAt = addMinutes(new Date(), EMAIL_CHALLENGE_EXPIRY_MINUTES).getTime();

    await this.verificationStore.save(`email:challenge:${challengeId}`, {
      value: JSON.stringify(payload),
      expiresAt,
    });

    await this.verificationStore.save(`email:${userId}`, {
      value: JSON.stringify(payload),
      expiresAt,
    });

    return {
      ok: true,
      challengeId,
      expiresIn: EMAIL_CHALLENGE_EXPIRY_MINUTES * 60,
      email,
      code,
    };
  }
}
