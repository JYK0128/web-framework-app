import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { User } from '#/entities/auth/user.entity';
import { UserIdentity } from '#/entities/auth/user-identity.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { PortOneService, type PortOneVerifiedIdentity } from '#/infra/portone';
import { VerifyIdentityCommand } from '#/modules/onboarding/commands/verify-identity.command';
import type { VerifyIdentityResponseDto } from '#/modules/onboarding/dto/verify-identity.response.dto';

@Injectable()
@CommandHandler(VerifyIdentityCommand)
export class VerifyIdentityHandler implements ICommandHandler<VerifyIdentityCommand, VerifyIdentityResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly portOneService: PortOneService,
  ) {}

  async execute(command: VerifyIdentityCommand): Promise<VerifyIdentityResponseDto> {
    const sessionUser = this.identifySessionUser();

    const verified = await this.portOneService.getVerifiedIdentity(
      command.input.identityVerificationId,
    );

    await this.verifyIdentityUnique(verified);

    return this.process(sessionUser.id, verified);
  }

  private identifySessionUser() {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    if (sessionUser.phoneNumberVerified) {
      throw new ApplicationError({ code: 'PHONE_ALREADY_VERIFIED', status: HttpStatus.BAD_REQUEST });
    }
    return sessionUser;
  }

  private async verifyIdentityUnique(verified: PortOneVerifiedIdentity): Promise<void> {
    const conditions: Array<Record<string, unknown>> = [];
    if (verified.di) conditions.push({ di: verified.di });
    if (verified.ci) conditions.push({ ci: verified.ci });

    if (conditions.length > 0) {
      const existing = await this.em.findOne(UserIdentity, { $or: conditions });
      if (existing) {
        throw new ApplicationError({
          code: 'IDENTITY_ALREADY_REGISTERED',
          status: HttpStatus.CONFLICT,
          message: '이미 본인인증이 완료된 다른 계정이 존재합니다.',
        });
      }
    }
  }

  private process(userId: string, verified: PortOneVerifiedIdentity): VerifyIdentityResponseDto {
    const user = this.em.getReference(User, userId);
    user.phoneNumber = verified.phoneNumber;
    user.phoneNumberVerified = true;

    if (verified.name) {
      user.name = verified.name;
    }

    if (verified.di || verified.ci) {
      const identity = this.em.create(UserIdentity, {
        user,
        di: verified.di ?? null,
        ci: verified.ci ?? null,
        name: verified.name,
        birthDate: verified.birthDate ?? null,
        gender: verified.gender ?? null,
        verifiedAt: new Date(),
      });
      this.em.persist(identity);
    }

    return {
      ok: true,
      name: verified.name,
      phoneNumber: verified.phoneNumber,
      phoneNumberVerified: true,
      birthDate: verified.birthDate,
      gender: verified.gender,
    };
  }
}
