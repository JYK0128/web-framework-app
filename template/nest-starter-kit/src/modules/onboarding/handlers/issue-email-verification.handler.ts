import { randomInt } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { addMinutes } from 'date-fns';
import { ClsService } from 'nestjs-cls';

import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { Verification } from '#/entities/auth/verification.entity';
import { IssueEmailVerificationCommand } from '#/modules/onboarding/commands/issue-email-verification.command';
import type { IssueEmailVerificationOutputDto } from '#/modules/onboarding/dto/issue-email-verification.output.dto';

const VERIFICATION_CODE_EXPIRY_MINUTES = 5;

@Injectable()
@CommandHandler(IssueEmailVerificationCommand)
export class IssueEmailVerificationHandler implements ICommandHandler<IssueEmailVerificationCommand, IssueEmailVerificationOutputDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_command: IssueEmailVerificationCommand): Promise<IssueEmailVerificationOutputDto> {
    const user = await this.identifyUser();
    this.verifyNotVerified(user);

    const code = this.generateCode();
    await this.process(user, code);

    return {
      email: user.email,
      code,
      expiresIn: VERIFICATION_CODE_EXPIRY_MINUTES * 60,
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

  private generateCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private async process(user: User, code: string): Promise<void> {
    const expiresAt = addMinutes(new Date(), VERIFICATION_CODE_EXPIRY_MINUTES);

    const existing = await this.em.findOne(Verification, { identifier: user.id });
    if (existing) {
      existing.value = code;
      existing.expiresAt = expiresAt;
    }
    else {
      const verification = this.em.create(Verification, {
        identifier: user.id,
        value: code,
        expiresAt,
      });
      this.em.persist(verification);
    }

    await this.em.flush();
  }
}
