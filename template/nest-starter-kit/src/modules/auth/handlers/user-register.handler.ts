import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash } from '@pkg/shared/server';

import { type AuthPolicyConfig, SystemContext } from '#/common/contexts/system.context';
import { RoleKey } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UserRegisterCommand } from '#/modules/auth/commands/user-register.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';
import { NotificationConfigDto } from '#/modules/system-config/dto/notification-config.dto';

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

    if (!authPolicy.allowCredentialRegistration) {
      throw new ApplicationError({
        code: 'CREDENTIAL_REGISTRATION_DISABLED',
        status: HttpStatus.FORBIDDEN,
      });
    }

    await this.validateOnboardingConfiguration(authPolicy);

    await this.systemContext.validatePassword(command.input.password, authPolicy);

    try {
      const result = await this.process(
        command.input.email,
        command.input.password,
        authPolicy,
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

  private async validateOnboardingConfiguration(authPolicy: AuthPolicyConfig): Promise<void> {
    const requiredTerms = await this.em.count(Term, {
      termGroup: { isRequired: true },
      publishedAt: { $ne: null, $lte: new Date() },
    });
    if (requiredTerms === 0) {
      throw new ApplicationError({
        code: 'ONBOARDING_NOT_CONFIGURED',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }

    if (authPolicy.requireEmailVerification) {
      const notification = await this.systemContext.getConfig<NotificationConfigDto>('notification');
      const smtp = notification?.email?.smtp;
      if (!smtp?.host || !smtp?.port || !smtp?.user || !smtp?.pass || !notification?.email?.from) {
        throw new ApplicationError({
          code: 'ONBOARDING_NOT_CONFIGURED',
          status: HttpStatus.SERVICE_UNAVAILABLE,
        });
      }
    }
  }

  private async process(
    email: string,
    password: string,
    authPolicy: AuthPolicyConfig,
  ): Promise<UserProfileResponseDto> {
    const user = new User();
    user.email = email;
    user.name = email.split('@')[0];
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
