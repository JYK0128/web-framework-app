import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { IdentityVerificationService, type VerifiedIdentity } from '#/common/services/identity-verification';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { VerifyIdentityCommand } from '#/modules/onboarding/commands/verify-identity.command';
import type { VerifyIdentityResponseDto } from '#/modules/onboarding/dto/verify-identity.response.dto';

@Injectable()
@CommandHandler(VerifyIdentityCommand)
export class VerifyIdentityHandler implements ICommandHandler<VerifyIdentityCommand, VerifyIdentityResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly identityVerificationService: IdentityVerificationService,
  ) {}

  async execute(command: VerifyIdentityCommand): Promise<VerifyIdentityResponseDto> {
    const user = await this.identifyUser();
    this.verifyNotVerified(user);

    const verified = await this.identityVerificationService.getVerifiedIdentity(
      command.input.identityVerificationId,
    );

    await this.verifyPhoneNumberAvailable(verified.phoneNumber, user.id);

    return this.process(user, verified);
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

  private process(user: User, verified: VerifiedIdentity): VerifyIdentityResponseDto {
    user.phoneNumber = verified.phoneNumber;
    user.phoneNumberVerified = true;

    if (verified.name) {
      user.name = verified.name;
    }

    if (verified.ci || verified.di) {
      user.metadata = {
        ...user.metadata,
        ci: verified.ci,
        di: verified.di,
        verifiedAt: new Date().toISOString(),
      };
    }

    return {
      ok: true,
      name: user.name,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: true,
      birthDate: verified.birthDate,
      gender: verified.gender,
    };
  }
}
