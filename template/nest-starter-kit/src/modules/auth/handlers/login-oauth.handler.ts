import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { AppEntityManager } from '#/database/entity-manager';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { TwoFactorCreateChallengeCommand } from '#/modules/auth/commands/2fa-create-challenge.command';
import { LoginOAuthCommand } from '#/modules/auth/commands/login-oauth.command';
import type { LoginOAuthResponseDto } from '#/modules/auth/dto/login-oauth.response.dto';

@Injectable()
@CommandHandler(LoginOAuthCommand)
export class LoginOAuthHandler implements ICommandHandler<LoginOAuthCommand, LoginOAuthResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: LoginOAuthCommand): Promise<LoginOAuthResponseDto> {
    const account = await this.identifyAccount(command.input.provider, command.input.accountId);

    if (account) {
      this.verifyNotBanned(account.user);
      return this.processUpdate(account, command.input);
    }

    const user = await this.identifyUser(command.input.email);
    if (user) {
      this.verifyNotBanned(user);
    }

    return this.processCreate(user, command.input);
  }

  private async identifyAccount(provider: string, accountId: string): Promise<Account | null> {
    return this.em.findOne(Account, {
      providerId: provider,
      accountId,
    }, { populate: ['user'] });
  }

  private async identifyUser(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  private verifyNotBanned(user: User): void {
    if (user.isBanned) {
      throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
    }
  }

  private async processUpdate(account: Account, input: LoginOAuthCommand['input']): Promise<LoginOAuthResponseDto> {
    if (input.accessToken) account.accessToken = input.accessToken;
    if (input.refreshToken) account.refreshToken = input.refreshToken;

    return this.toOutput(account.user);
  }

  private async processCreate(
    existingUser: User | null,
    input: LoginOAuthCommand['input'],
  ): Promise<LoginOAuthResponseDto> {
    let user = existingUser;

    if (!user) {
      user = this.em.create(User, {
        email: input.email,
        name: input.name,
        role: RoleName.USER,
      });
      this.em.persist(user);
    }

    const account = this.em.create(Account, {
      user,
      providerId: input.provider,
      accountId: input.accountId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
    });
    this.em.persist(account);

    return this.toOutput(user);
  }

  private async toOutput(user: User): Promise<LoginOAuthResponseDto> {
    if (user.twoFactorEnabled) {
      const challenge = await this.commandBus.execute(new TwoFactorCreateChallengeCommand({ userId: user.id }));
      return { challengeId: challenge.challengeId };
    }

    await this.sessionContext.establish({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      phoneNumber: user.phoneNumber ?? null,
      phoneNumberVerified: Boolean(user.phoneNumberVerified),
      role: user.role ?? null,
      permissions: {},
      requiredTermsAgreed: false,
      passwordUpdatedAt: null,
      isPasswordChangeRequired: false,
    });

    return { ok: true };
  }
}
