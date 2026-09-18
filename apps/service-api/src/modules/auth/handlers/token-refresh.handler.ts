import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { TokenStoreService } from '#/common/services/token-store.service';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AuthTokenService } from '#/modules/auth/auth-token.service';
import { TokenRefreshCommand } from '#/modules/auth/commands/token-refresh.command';
import { TokenRefreshResponseDto } from '#/modules/auth/dto';

@Injectable()
@CommandHandler(TokenRefreshCommand)
export class TokenRefreshHandler implements ICommandHandler<TokenRefreshCommand, TokenRefreshResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly tokenStoreService: TokenStoreService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(command: TokenRefreshCommand): Promise<TokenRefreshResponseDto> {
    const refreshToken = command.input.refreshToken || command.cookieRefreshToken;
    if (!refreshToken) {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
        message: '인증 토큰이 존재하지 않습니다.',
      });
    }

    const tokenData = await this.tokenStoreService.get(refreshToken);
    if (!tokenData || !tokenData.sub) {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
        message: '토큰이 만료되었거나 로그아웃되었습니다.',
      });
    }

    const user = await this.em.findOne(User, { id: tokenData.sub }, { populate: ['role'] });
    if (!user || user.isBanned || user.isLocked) {
      await this.tokenStoreService.revoke(refreshToken);
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
        message: '계정 상태가 유효하지 않아 인증이 종료되었습니다.',
      });
    }

    const tokenPair = await this.authTokenService.rotateTokenPair(refreshToken, user);
    return TokenRefreshResponseDto.fromPlain(tokenPair);
  }
}
