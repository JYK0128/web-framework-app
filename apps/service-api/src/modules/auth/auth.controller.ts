import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { detectEnvironment, TimeUtil } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Cookie } from '#/common/decorators/cookie.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import type { TokenPairResult } from '#/modules/auth/auth-token.service';
import { LoginCredentialCommand, LogoutCommand, TokenRefreshCommand } from '#/modules/auth/commands';
import { LoginCredentialRequestDto, LoginCredentialResponseDto, LogoutRequestDto, LogoutResponseDto, MeRequestDto, MeResponseDto, TokenRefreshRequestDto, TokenRefreshResponseDto } from '#/modules/auth/dto';
import { MeQuery } from '#/modules/auth/queries';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly principalContext: PrincipalContext,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사내 관리자 로그인 (Refresh Token + 초단기 JWT 발급)' })
  @SwaggerApiResponse(LoginCredentialResponseDto)
  async login(
    @Body() dto: LoginCredentialRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginCredentialResponseDto> {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.commandBus.execute<LoginCredentialCommand, TokenPairResult>(
      new LoginCredentialCommand(dto, { ip, userAgent }),
    );

    const env = detectEnvironment(userAgent);
    const cookieMaxAge = dto.rememberMe ? TimeUtil.ms.day(30) : TimeUtil.ms.minute(30);

    if (env.isWebBrowser || env.isWebView) {
      res.cookie('service_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: cookieMaxAge,
      });

      return {
        accessToken: result.accessToken,
      };
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Public()
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Token 기반 초단기 AccessToken 갱신 및 토큰 회전' })
  @SwaggerApiResponse(TokenRefreshResponseDto)
  async token(
    @Body() dto: TokenRefreshRequestDto,
    @Cookie('service_refresh_token') cookieRefreshToken: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenRefreshResponseDto> {
    const refreshToken = dto.refreshToken ?? cookieRefreshToken;
    const result = await this.commandBus.execute<TokenRefreshCommand, TokenPairResult>(
      new TokenRefreshCommand(dto, refreshToken),
    );

    const env = detectEnvironment(userAgent);
    if (env.isWebBrowser || env.isWebView) {
      if (result.refreshToken) {
        res.cookie('service_refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/api/v1/auth',
          maxAge: TimeUtil.ms.second(result.refreshTokenTtlSeconds),
        });
      }

      return {
        accessToken: result.accessToken,
      };
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃 (Refresh Token 무효화)' })
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(
    @Body() dto: LogoutRequestDto,
    @Cookie('service_refresh_token') cookieRefreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const refreshToken = cookieRefreshToken ?? dto.refreshToken;
    const result = await this.commandBus.execute<LogoutCommand, LogoutResponseDto>(
      new LogoutCommand({ refreshToken, input: dto }),
    );

    res.clearCookie('service_refresh_token', { path: '/api/v1/auth' });
    return result;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인한 사용자 프로필 정보 조회' })
  @SwaggerApiResponse(MeResponseDto)
  async me(
    @Query() query: MeRequestDto,
  ): Promise<MeResponseDto> {
    const user = this.principalContext.ensureUser();
    return this.queryBus.execute<MeQuery, MeResponseDto>(
      new MeQuery({ userId: user.id, query }),
    );
  }
}
