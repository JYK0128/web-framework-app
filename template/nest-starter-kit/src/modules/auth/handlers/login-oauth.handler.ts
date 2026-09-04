import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { RoleKey } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
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
    const { account, user } = await this.identify(command.input);
    this.verify(user);
    return this.process(user, account, command.input);
  }

  private async identify(input: LoginOAuthCommand['input']): Promise<{ account: Account | null, user: User | null }> {
    const account = await this.em.findOne(Account, {
      providerId: input.provider,
      accountId: input.accountId,
    }, { populate: ['user'] });

    const user = account?.user ?? await this.em.findOne(User, { email: input.email });
    return { account, user };
  }

  private verify(user: User | null): void {
    if (user?.isBanned) {
      throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
    }
  }

  private async process(
    existingUser: User | null,
    existingAccount: Account | null,
    input: LoginOAuthCommand['input'],
  ): Promise<LoginOAuthResponseDto> {
    let user: User;

    if (existingAccount) {
      user = existingAccount.user;
      if (input.accessToken) existingAccount.accessToken = input.accessToken;
      if (input.refreshToken) existingAccount.refreshToken = input.refreshToken;
    }
    else {
      user = existingUser ?? this.em.create(User, {
        email: input.email,
        name: input.name,
        role: RoleKey.USER,
        emailVerified: true,
      });

      if (!existingUser) {
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
    }

    await this.em.flush();

    if (user.twoFactorEnabled) {
      const challenge = await this.commandBus.execute(
        new TwoFactorCreateChallengeCommand({ userId: user.id }),
      );
      return { challengeId: challenge.challengeId, expiresIn: challenge.expiresIn };
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
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    });

    return { ok: true };
  }
}
