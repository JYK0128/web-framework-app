import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { addMinutes } from 'date-fns';

import { SessionContext } from '#/common/contexts/session.context';
import { SystemContext } from '#/common/contexts/system.context';
import { VerificationStore } from '#/common/stores/verification.store';
import { IssueEmailChallengeCommand, type IssueEmailChallengeResult } from '#/modules/onboarding/commands/issue-email-challenge.command';
import { OnboardingPrerequisiteService } from '#/modules/onboarding/services';

@Injectable()
@CommandHandler(IssueEmailChallengeCommand)
export class IssueEmailChallengeHandler implements ICommandHandler<IssueEmailChallengeCommand, IssueEmailChallengeResult> {
  constructor(
    private readonly sessionContext: SessionContext,
    private readonly systemContext: SystemContext,
    private readonly verificationStore: VerificationStore,
    private readonly prerequisites: OnboardingPrerequisiteService,
  ) {}

  async execute(_command: IssueEmailChallengeCommand): Promise<IssueEmailChallengeResult> {
    await this.prerequisites.ensureEmailVerification();
    const sessionUser = this.identifySessionUser();
    this.verify(sessionUser);
    return this.process(sessionUser.id, sessionUser.email);
  }

  private verify(sessionUser: { id: string, email: string }): void {
    if (!sessionUser.id || !sessionUser.email) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
  }

  private identifySessionUser() {
    const sessionUser = this.sessionContext.requiredUser;
    if (sessionUser.emailVerified) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_VERIFIED', status: HttpStatus.BAD_REQUEST });
    }
    return sessionUser;
  }

  private async process(userId: string, email: string): Promise<IssueEmailChallengeResult> {
    const challengeId = randomUUID();
    const code = randomBytes(32).toString('base64url');
    const payload = { challengeId, userId, email, code };
    const expiryMinutes = (await this.systemContext.getVerificationPolicy()).emailChallengeExpiryMinutes;
    const expiresAt = addMinutes(new Date(), expiryMinutes).getTime();

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
      expiresIn: expiryMinutes * 60,
      email,
      code,
    };
  }
}
