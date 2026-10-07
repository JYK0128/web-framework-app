import { Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimeUtil } from '@pkg/shared/common';
import { API_BASE_PATH } from '@pkg/shared/config';
import type { Response } from 'express';

import { SECURITY_CONFIG } from '#/app.config';
import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { env } from '#/env';
import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { OAuthProviderListResponseDto } from '#/modules/auth/dto';
import { OAuthAuthenticationService } from '#/modules/auth/oauth-authentication.service';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly oauth: OAuthAuthenticationService) {}

  @Public()
  @Get('providers')
  @ApiOperation({ summary: '활성화된 OAuth 로그인 공급자 조회' })
  @SwaggerApiResponse(OAuthProviderListResponseDto)
  async providers(): Promise<OAuthProviderListResponseDto> {
    return { items: await this.oauth.getEnabledProviders() };
  }

  @Public()
  @Get(':providerId')
  @ApiOperation({ summary: 'OAuth 로그인 시작' })
  async begin(
    @Param('providerId') providerId: string,
    @Query('callback') callback: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const callbackUrl = this.callbackUrl(providerId);
    const redirectUrl = await this.oauth.begin(providerId, callbackUrl, this.sanitizeReturnTo(callback));
    response.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Public()
  @Get(':providerId/callback')
  @ApiOperation({ summary: 'OAuth 인증 응답 처리' })
  async callback(
    @Param('providerId') providerId: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') providerError: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    try {
      if (providerError) throw new Error('OAUTH_PROVIDER_CANCELLED');
      const completion = await this.oauth.complete(providerId, code ?? '', state ?? '');
      await this.setRefreshCookie(completion.tokens, response);
      const target = this.frontendUrl(completion.returnTo);
      response.redirect(HttpStatus.FOUND, target.toString());
    }
    catch (error) {
      let errorCode = 'OAUTH_LOGIN_FAILED';
      if (error instanceof Error && 'code' in error && typeof error.code === 'string') errorCode = error.code;
      else if (error instanceof Error && error.message === 'OAUTH_PROVIDER_CANCELLED') errorCode = 'OAUTH_CANCELLED';
      const target = this.frontendUrl('/login');
      target.searchParams.set('error', errorCode);
      response.redirect(HttpStatus.FOUND, target.toString());
    }
  }

  private callbackUrl(providerId: string): string {
    return new URL(`${API_BASE_PATH}/auth/oauth/${encodeURIComponent(providerId)}/callback`, env.APP_BASE_URL).toString();
  }

  private frontendUrl(path: string): URL {
    return new URL(path, env.APP_BASE_URL);
  }

  private sanitizeReturnTo(callback: string | undefined): string {
    if (!callback) return '/';
    try {
      const base = new URL(env.APP_BASE_URL);
      const target = new URL(callback, base);
      return target.origin === base.origin ? `${target.pathname}${target.search}${target.hash}` : '/';
    }
    catch {
      return '/';
    }
  }

  private async setRefreshCookie(tokens: TokenPairResult, response: Response): Promise<void> {
    if (!tokens.refreshToken || !tokens.refreshTokenTtlSeconds) return;
    response.cookie(SECURITY_CONFIG.token.refreshCookieName, tokens.refreshToken, {
      httpOnly: true,
      secure: SECURITY_CONFIG.cookie.secure,
      sameSite: SECURITY_CONFIG.cookie.sameSite,
      maxAge: TimeUtil.ms.second(tokens.refreshTokenTtlSeconds),
    });
  }
}
