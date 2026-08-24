import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, z } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { SessionContext } from '#/common/contexts/session.context';
import { type VerificationRecord, VerificationStore } from '#/common/stores/verification.store';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { VerifyPhoneChangeCommand } from '#/modules/auth/commands/verify-phone-change.command';
import type { VerifyPhoneChangeResponseDto } from '#/modules/auth/dto/verify-phone-change.response.dto';

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
@CommandHandler(VerifyPhoneChangeCommand)
export class VerifyPhoneChangeHandler implements ICommandHandler<VerifyPhoneChangeCommand, VerifyPhoneChangeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly sessionContext: SessionContext,
    private readonly verificationStore: VerificationStore,
  ) {}

  async execute(command: VerifyPhoneChangeCommand): Promise<VerifyPhoneChangeResponseDto> {
    const user = await this.identifyUser();
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
    const verification = await this.verificationStore.get(`phone-change:${userId}`);
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

  private async process(user: User, challenge: IdentifiedPhoneChallenge): Promise<VerifyPhoneChangeResponseDto> {
    const consumed = await this.verificationStore.consume(`phone-change:${user.id}`);
    if (
      !consumed
      || consumed.value !== challenge.verification.value
      || consumed.expiresAt !== challenge.verification.expiresAt
    ) {
      throw new ApplicationError({ code: 'INVALID_PHONE_CHALLENGE', status: HttpStatus.BAD_REQUEST });
    }

    user.phoneNumber = challenge.payload.phoneNumber;
    user.phoneNumberVerified = true;

    // Update current session user
    const currentSessionUser = this.requestContext.request?.session.user;
    if (currentSessionUser) {
      await this.sessionContext.establish({
        ...currentSessionUser,
        phoneNumber: challenge.payload.phoneNumber,
        phoneNumberVerified: true,
      });
    }

    return { ok: true, phoneNumber: challenge.payload.phoneNumber, phoneNumberVerified: true };
  }
}
