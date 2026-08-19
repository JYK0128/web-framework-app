import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { type AuthVerificationRecord, AuthVerificationStore } from '#/common/security/auth-verification.store';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { VerifyEmailCommand } from '#/modules/onboarding/commands/verify-email.command';
import type { VerifyEmailResponseDto } from '#/modules/onboarding/dto/verify-email.response.dto';

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  private readonly logger = new Logger(VerifyEmailHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly cls: ClsService,
    private readonly authVerificationStore: AuthVerificationStore,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    const user = await this.identifyUser();
    this.verifyNotVerified(user);

    const verification = await this.identifyVerification(user.id);
    this.verifyCode(verification, command.input.code);

    await this.process(user, verification);

    return {
      ok: true,
      emailVerified: true,
    };
  }

  private async identifyUser(): Promise<User> {
    const sessionUser = this.cls.get('user');
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

  private async identifyVerification(userId: string): Promise<AuthVerificationRecord> {
    const verification = await this.authVerificationStore.get(`email:${userId}`);
    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_VERIFICATION_CODE', status: HttpStatus.BAD_REQUEST });
    }
    return verification;
  }

  private verifyCode(verification: AuthVerificationRecord, inputCode: string): void {
    if (verification.expiresAt <= Date.now()) {
      throw new ApplicationError({ code: 'EXPIRED_VERIFICATION_CODE', status: HttpStatus.BAD_REQUEST });
    }

    if (verification.value.trim() !== inputCode.trim()) {
      throw new ApplicationError({ code: 'INVALID_VERIFICATION_CODE', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(user: User, verification: AuthVerificationRecord): Promise<void> {
    const consumed = await this.authVerificationStore.consume(`email:${user.id}`);
    if (
      !consumed
      || consumed.value !== verification.value
      || consumed.expiresAt !== verification.expiresAt
    ) {
      throw new ApplicationError({ code: 'INVALID_VERIFICATION_CODE', status: HttpStatus.BAD_REQUEST });
    }

    user.emailVerified = true;
    await this.em.flush();

    this.logger.log(`[Email Verification] User ${user.email} successfully verified email.`);
  }
}
