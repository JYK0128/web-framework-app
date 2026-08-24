import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, z } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { type VerificationRecord, VerificationStore } from '#/common/stores/verification.store';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { VerifyPhoneCommand } from '#/modules/onboarding/commands/verify-phone.command';
import type { VerifyPhoneResponseDto } from '#/modules/onboarding/dto/verify-phone.response.dto';

const phoneChallengePayloadSchema = z.object({
  challengeId: z.string(),
  phoneNumber: z.string(),
  code: z.string(),
});

type PhoneChallengePayload = z.infer<typeof phoneChallengePayloadSchema>;

interface IdentifiedPhoneChallenge {
  payload: PhoneChallengePayload
  verification: VerificationRecord
}

@Injectable()
@CommandHandler(VerifyPhoneCommand)
export class VerifyPhoneHandler implements ICommandHandler<VerifyPhoneCommand, VerifyPhoneResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly verificationStore: VerificationStore,
  ) {}

  async execute(command: VerifyPhoneCommand): Promise<VerifyPhoneResponseDto> {
    const user = await this.identifyUser();
    this.verifyNotVerified(user);
    const challenge = await this.identifyChallenge(user.id);
    this.verifyChallenge(challenge, command.input.challengeId, command.input.code);
    await this.verifyPhoneNumberAvailable(challenge.payload.phoneNumber, user.id);

    return this.process(user, challenge);
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

  private async identifyChallenge(userId: string): Promise<IdentifiedPhoneChallenge> {
    const verification = await this.verificationStore.get(`phone:${userId}`);
    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_PHONE_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }

    const rawJson = JSON.safeParse<unknown>(verification.value, null);
    const parsed = phoneChallengePayloadSchema.safeParse(rawJson);
    if (!parsed.success) {
      throw new ApplicationError({ code: 'INVALID_PHONE_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }
    return { payload: parsed.data, verification };
  }

  private verifyNotVerified(user: User): void {
    if (user.phoneNumberVerified) {
      throw new ApplicationError({ code: 'PHONE_ALREADY_VERIFIED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private verifyChallenge(challenge: IdentifiedPhoneChallenge, challengeId: string, code: string): void {
    if (challenge.verification.expiresAt <= Date.now()) {
      throw new ApplicationError({ code: 'EXPIRED_PHONE_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }
    if (challenge.payload.challengeId !== challengeId || challenge.payload.code !== code.trim()) {
      throw new ApplicationError({ code: 'INVALID_PHONE_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async verifyPhoneNumberAvailable(phoneNumber: string, userId: string): Promise<void> {
    const existingUser = await this.em.findOne(User, { phoneNumber, id: { $ne: userId } });
    if (existingUser) {
      throw new ApplicationError({ code: 'PHONE_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
    }
  }

  private async process(user: User, challenge: IdentifiedPhoneChallenge): Promise<VerifyPhoneResponseDto> {
    const consumed = await this.verificationStore.consume(`phone:${user.id}`);
    if (
      !consumed
      || consumed.value !== challenge.verification.value
      || consumed.expiresAt !== challenge.verification.expiresAt
    ) {
      throw new ApplicationError({ code: 'INVALID_PHONE_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }

    user.phoneNumber = challenge.payload.phoneNumber;
    user.phoneNumberVerified = true;
    return { ok: true, phoneNumber: challenge.payload.phoneNumber, phoneNumberVerified: true };
  }
}
