import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { SessionContext } from '#/common/contexts/session.context';
import { User } from '#/entities/auth/user.entity';
import { UserIdentity } from '#/entities/auth/user-identity.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { PortOneService, type PortOneVerifiedIdentity } from '#/infra/portone';
import { VerifyIdentityPhoneChangeCommand } from '#/modules/auth/commands/verify-identity-phone-change.command';
import type { VerifyIdentityPhoneChangeResponseDto } from '#/modules/auth/dto/verify-identity-phone-change.response.dto';

@Injectable()
@CommandHandler(VerifyIdentityPhoneChangeCommand)
export class VerifyIdentityPhoneChangeHandler implements ICommandHandler<VerifyIdentityPhoneChangeCommand, VerifyIdentityPhoneChangeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly sessionContext: SessionContext,
    private readonly portOneService: PortOneService,
  ) {}

  async execute(command: VerifyIdentityPhoneChangeCommand): Promise<VerifyIdentityPhoneChangeResponseDto> {
    const user = await this.identifyUser();
    const verified = await this.portOneService.getVerifiedIdentity(command.input.identityVerificationId);

    await this.verifySamePerson(user, verified);
    await this.verifyPhoneNumberAvailable(verified.phoneNumber, user.id);

    return this.process(user, verified);
  }

  private async identifyUser(): Promise<User> {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id }, { populate: ['identity'] });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private async verifySamePerson(user: User, verified: PortOneVerifiedIdentity): Promise<void> {
    // If user already has an identity record, verify CI/DI matches
    if (user.identity) {
      const matchesDi = Boolean(user.identity.di && verified.di && user.identity.di === verified.di);
      const matchesCi = Boolean(user.identity.ci && verified.ci && user.identity.ci === verified.ci);

      if (!matchesDi && !matchesCi) {
        throw new ApplicationError({
          code: 'IDENTITY_MISMATCH',
          status: HttpStatus.BAD_REQUEST,
          message: '본인 명의의 휴대폰 번호로만 변경할 수 있습니다.',
        });
      }
    }
    else if (verified.di || verified.ci) {
      // If user doesn't have identity record yet, check if this CI/DI belongs to another user
      const conditions: Array<Record<string, unknown>> = [];
      if (verified.di) conditions.push({ di: verified.di });
      if (verified.ci) conditions.push({ ci: verified.ci });

      const existing = await this.em.findOne(UserIdentity, {
        $or: conditions,
        user: { id: { $ne: user.id } },
      });
      if (existing) {
        throw new ApplicationError({
          code: 'IDENTITY_ALREADY_REGISTERED',
          status: HttpStatus.CONFLICT,
          message: '이미 다른 계정에 등록된 본인확인 정보입니다.',
        });
      }
    }
  }

  private async verifyPhoneNumberAvailable(phoneNumber: string, userId: string): Promise<void> {
    const existingUser = await this.em.findOne(User, { phoneNumber, id: { $ne: userId } });
    if (existingUser) {
      throw new ApplicationError({
        code: 'PHONE_ALREADY_REGISTERED',
        status: HttpStatus.CONFLICT,
        message: '이미 다른 계정에서 사용 중인 휴대폰 번호입니다.',
      });
    }
  }

  private async process(user: User, verified: PortOneVerifiedIdentity): Promise<VerifyIdentityPhoneChangeResponseDto> {
    user.phoneNumber = verified.phoneNumber;
    user.phoneNumberVerified = true;
    if (verified.name) {
      user.name = verified.name;
    }

    if (user.identity) {
      user.identity.name = verified.name;
      if (verified.birthDate) user.identity.birthDate = verified.birthDate;
      if (verified.gender) user.identity.gender = verified.gender;
      user.identity.verifiedAt = new Date();
    }
    else if (verified.di || verified.ci) {
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

    // Sync session
    const sessionUser = this.requestContext.request?.session.user;
    if (sessionUser) {
      await this.sessionContext.establish({
        ...sessionUser,
        phoneNumber: verified.phoneNumber,
        phoneNumberVerified: true,
        name: verified.name || sessionUser.name,
      });
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
