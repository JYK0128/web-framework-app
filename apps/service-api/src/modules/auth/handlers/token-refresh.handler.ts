import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { TokenStoreService } from '#/common/services/token-store.service';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AuthTokenService, type TokenPairResult } from '#/modules/auth/auth-token.service';
import { TokenRefreshCommand } from '#/modules/auth/commands/token-refresh.command';

@Injectable()
@CommandHandler(TokenRefreshCommand)
export class TokenRefreshHandler implements ICommandHandler<TokenRefreshCommand> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly tokenStoreService: TokenStoreService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(command: TokenRefreshCommand): Promise<TokenPairResult> {
    const refreshToken = command.input.refreshToken || command.cookieRefreshToken;
    if (!refreshToken) {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
        message: '인증 토큰이 존재하지 않습니다.',
      });
    }

    const consumed = await this.tokenStoreService.consumeRefreshToken(refreshToken);
    if (consumed.status === 'fail') {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
        message: consumed.reason === 'reused'
          ? '이미 사용된 refresh token입니다. 인증 세션을 종료합니다.'
          : '토큰이 만료되었거나 로그아웃되었습니다.',
      });
    }

    const tokenData = consumed.record;

    const user = await this.em.findOne(User, { id: tokenData.sub }, { populate: ['role'] });
    if (!user || user.isBanned || user.isLocked) {
      await this.tokenStoreService.revokeRefreshTokenFamily(tokenData.familyId);
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
        message: '계정 상태가 유효하지 않아 인증이 종료되었습니다.',
      });
    }

    const tokenPair = await this.authTokenService.rotateTokenPair(user, {
      rememberMe: tokenData.rememberMe === true,
      familyId: tokenData.familyId,
    });
    return tokenPair;
  }
}
