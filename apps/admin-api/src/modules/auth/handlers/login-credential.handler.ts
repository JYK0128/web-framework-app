import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verify } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AuthTokenService } from '#/modules/auth/auth-token.service';
import { LoginCredentialCommand } from '#/modules/auth/commands/login-credential.command';
import { LoginCredentialResponseDto } from '#/modules/auth/dto';

@Injectable()
@CommandHandler(LoginCredentialCommand)
export class LoginCredentialHandler implements ICommandHandler<LoginCredentialCommand, LoginCredentialResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(command: LoginCredentialCommand): Promise<LoginCredentialResponseDto> {
    const { input } = command;

    const user = await this.em.findOne(User, { email: input.email }, { populate: ['role'] });
    if (!user) {
      throw new ApplicationError({
        code: 'INVALID_CREDENTIALS',
        status: HttpStatus.UNAUTHORIZED,
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
      });
    }

    if (user.isDeleted) {
      throw new ApplicationError({
        code: 'ACCOUNT_DELETED',
        status: HttpStatus.FORBIDDEN,
        message: '삭제된 계정입니다. 관리자에게 문의하세요.',
      });
    }

    if (user.isBanned) {
      throw new ApplicationError({
        code: 'ACCOUNT_BANNED',
        status: HttpStatus.FORBIDDEN,
        message: user.banReason ? `이용이 제한된 계정입니다: ${user.banReason}` : '이용이 제한된 계정입니다.',
      });
    }

    if (user.isLocked) {
      throw new ApplicationError({
        code: 'ACCOUNT_LOCKED',
        status: HttpStatus.FORBIDDEN,
        message: '로그인 실패 횟수 초과로 계정이 잠겼습니다. 잠시 후 다시 시도하세요.',
      });
    }

    const account = await this.em.findOne(Account, {
      user: user.id,
      providerId: 'credential',
    });

    if (!account || !account.password) {
      throw new ApplicationError({
        code: 'INVALID_CREDENTIALS',
        status: HttpStatus.UNAUTHORIZED,
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
      });
    }

    const isPasswordValid = await verify(input.password, account.password);
    if (!isPasswordValid) {
      const attempts = (user.metadata?.failedLoginAttempts ?? 0) + 1;
      const patch: Record<string, unknown> = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        patch.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      user.updateMetadata(patch);
      await this.em.flush();

      throw new ApplicationError({
        code: 'INVALID_CREDENTIALS',
        status: HttpStatus.UNAUTHORIZED,
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
      });
    }

    user.updateMetadata({
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    await this.em.flush();

    const tokenPair = await this.authTokenService.createTokenPair(user, {
      rememberMe: input.rememberMe,
    });
    return LoginCredentialResponseDto.fromPlain(tokenPair);
  }
}
