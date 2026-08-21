import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { addMinutes } from 'date-fns';

import { RequestContext } from '#/common/contexts/request.context';
import { FirebaseService } from '#/common/services/firebase/firebase.service';
import { VerificationStore } from '#/common/stores/verification.store';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { IssueEmailVerificationCommand } from '#/modules/onboarding/commands/issue-email-verification.command';
import type { IssueEmailVerificationResponseDto } from '#/modules/onboarding/dto/issue-email-verification.response.dto';
import { EmailVerificationCodeIssuedEvent } from '#/modules/onboarding/events';

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;

@Injectable()
@CommandHandler(IssueEmailVerificationCommand)
export class IssueEmailVerificationHandler implements ICommandHandler<IssueEmailVerificationCommand, IssueEmailVerificationResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly verificationStore: VerificationStore,
    private readonly firebaseService: FirebaseService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(_command: IssueEmailVerificationCommand): Promise<IssueEmailVerificationResponseDto> {
    const user = await this.identifyUser();
    this.verifyNotVerified(user);

    const { link, oobCode } = await this.firebaseService.generateEmailVerificationLink(user.email);
    await this.process(user, oobCode, link);

    return {
      ok: true,
      expiresIn: VERIFICATION_CODE_EXPIRY_MINUTES * 60,
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

  private async process(user: User, oobCode: string, link: string): Promise<void> {
    const expiresAt = addMinutes(new Date(), VERIFICATION_CODE_EXPIRY_MINUTES);
    await this.verificationStore.save(
      `email:${user.id}`,
      {
        value: oobCode,
        expiresAt: expiresAt.getTime(),
      },
    );

    this.eventBus.publish(
      new EmailVerificationCodeIssuedEvent(user.email, oobCode, VERIFICATION_CODE_EXPIRY_MINUTES * 60, link),
    );
  }
}
