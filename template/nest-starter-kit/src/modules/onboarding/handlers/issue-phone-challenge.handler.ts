import { randomInt, randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { addMinutes } from 'date-fns';

import { RequestContext } from '#/common/contexts/request.context';
import { isKoreanMobilePhoneNumber, normalizePhoneNumber } from '#/common/helpers/phone.helper';
import { VerificationStore } from '#/common/stores/verification.store';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { IssuePhoneChallengeCommand, type PhoneChallengePayload } from '#/modules/onboarding/commands/issue-phone-challenge.command';
import type { IssuePhoneChallengeResponseDto } from '#/modules/onboarding/dto/issue-phone-challenge.response.dto';

const PHONE_CHALLENGE_EXPIRY_MINUTES = 5;

@Injectable()
@CommandHandler(IssuePhoneChallengeCommand)
export class IssuePhoneChallengeHandler implements ICommandHandler<IssuePhoneChallengeCommand, IssuePhoneChallengeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly verificationStore: VerificationStore,
  ) {}

  async execute(command: IssuePhoneChallengeCommand): Promise<IssuePhoneChallengeResponseDto> {
    this.verifyMockProviderAvailable();
    const user = await this.identifyUser();
    const phoneNumber = this.identifyPhoneNumber(command.input.phoneNumber);
    this.verifyNotVerified(user);
    await this.verifyPhoneNumberAvailable(phoneNumber, user.id);

    return this.process(user.id, phoneNumber);
  }

  private verifyMockProviderAvailable(): void {
    if (env.NODE_ENV === 'production') {
      throw new ApplicationError({
        code: 'PHONE_VERIFICATION_UNAVAILABLE',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
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

  private identifyPhoneNumber(input: string): string {
    const phoneNumber = normalizePhoneNumber(input);
    if (!isKoreanMobilePhoneNumber(phoneNumber)) {
      throw new ApplicationError({ code: 'INVALID_PHONE_NUMBER', status: HttpStatus.BAD_REQUEST });
    }
    return phoneNumber;
  }

  private verifyNotVerified(user: User): void {
    if (user.phoneNumberVerified) {
      throw new ApplicationError({ code: 'PHONE_ALREADY_VERIFIED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async verifyPhoneNumberAvailable(phoneNumber: string, userId: string): Promise<void> {
    const existingUser = await this.em.findOne(User, { phoneNumber, id: { $ne: userId } });
    if (existingUser) {
      throw new ApplicationError({ code: 'PHONE_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
    }
  }

  private async process(userId: string, phoneNumber: string): Promise<IssuePhoneChallengeResponseDto> {
    const challengeId = randomUUID();
    const code = randomInt(100_000, 1_000_000).toString();
    const payload: PhoneChallengePayload = { challengeId, phoneNumber, code };

    await this.verificationStore.save(`phone:${userId}`, {
      value: JSON.stringify(payload),
      expiresAt: addMinutes(new Date(), PHONE_CHALLENGE_EXPIRY_MINUTES).getTime(),
    });

    return {
      ok: true,
      challengeId,
      expiresIn: PHONE_CHALLENGE_EXPIRY_MINUTES * 60,
      mockCode: code,
    };
  }
}
