import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, normalizePhoneNumber } from '@pkg/shared/common';
import { hash } from '@pkg/shared/server';

import { type AuthPolicyConfig, SystemContext } from '#/common/contexts/system.context';
import { RoleKey } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UserRegisterCommand } from '#/modules/auth/commands/user-register.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

@Injectable()
@CommandHandler(UserRegisterCommand)
export class UserRegisterHandler implements ICommandHandler<UserRegisterCommand, UserProfileResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
  ) {}

  async execute(command: UserRegisterCommand): Promise<UserProfileResponseDto> {
    const authPolicy = await this.systemContext.getAuthPolicy();
    if (!authPolicy.allowRegistration) {
      throw new ApplicationError({
        code: 'REGISTRATION_DISABLED',
        status: HttpStatus.FORBIDDEN,
      });
    }

    if (!authPolicy.allowPasswordRegistration) {
      throw new ApplicationError({
        code: 'PASSWORD_REGISTRATION_DISABLED',
        status: HttpStatus.FORBIDDEN,
      });
    }

    await this.systemContext.validatePassword(command.input.password, authPolicy);

    try {
      const result = await this.process(
        command.input.email,
        command.input.name,
        command.input.password,
        authPolicy,
        command.input.phoneNumber,
      );
      await this.em.flush();
      return result;
    }
    catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ApplicationError({
          code: 'EMAIL_ALREADY_EXISTS',
          status: HttpStatus.CONFLICT,
          message: '이미 등록된 이메일 계정입니다.',
        });
      }
      throw error;
    }
  }

  private async process(
    email: string,
    name: string,
    password: string,
    authPolicy: AuthPolicyConfig,
    rawPhone?: string,
  ): Promise<UserProfileResponseDto> {
    const user = new User();
    user.email = email;
    user.name = name;
    if (rawPhone && rawPhone.trim().length > 0) {
      user.phoneNumber = normalizePhoneNumber(rawPhone);
    }
    user.role = RoleKey.USER;
    user.emailVerified = !authPolicy.requireEmailVerification;
    this.em.persist(user);

    const hashedPassword = await hash(password);
    const account = this.em.create(Account, {
      user,
      accountId: user.id,
      providerId: Account.PROVIDER_CREDENTIAL,
      password: hashedPassword,
      metadata: {
        passwordUpdatedAt: new Date(),
        passwordHistory: authPolicy.historyLimit > 0 ? [hashedPassword] : [],
      },
    });
    this.em.persist(account);

    return new UserProfileResponseDto(user, authPolicy.passwordExpirationDays, account.metadata);
  }
}
