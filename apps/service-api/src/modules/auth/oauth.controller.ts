import { Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { API_BASE_PATH, ApplicationError, TimeUtil } from '@pkg/shared/common';
import type { Response } from 'express';

import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SECURITY_CONFIG } from '#/config';
import { env } from '#/env';
import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { OAuthProvidersResponseDto } from '#/modules/auth/dto';
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
  @SwaggerApiResponse(OAuthProvidersResponseDto)
  async providers(): Promise<OAuthProvidersResponseDto> {
    return { providers: await this.oauth.getEnabledProviders() };
  }

  @Public()
  @Get(':providerId')
  @Throttle({ default: { limit: SECURITY_CONFIG.rateLimit.authenticationMaxRequests, ttl: SECURITY_CONFIG.rateLimit.authenticationWindowMs } })
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
  @Throttle({ default: { limit: SECURITY_CONFIG.rateLimit.authenticationMaxRequests, ttl: SECURITY_CONFIG.rateLimit.authenticationWindowMs } })
  @ApiOperation({ summary: 'OAuth 인증 응답 처리' })
  async callback(
    @Param('providerId') providerId: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') providerError: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const redirectUrl = this.frontendCallbackUrl();
    try {
      if (providerError) throw new Error('OAUTH_PROVIDER_CANCELLED');
      const completion = await this.oauth.complete(providerId, code ?? '', state ?? '');
      await this.setRefreshCookie(completion.tokens, response);
      const target = new URL('/oauth/callback', env.SERVICE_WEB_URL);
      target.searchParams.set('callback', completion.returnTo);
      response.redirect(HttpStatus.FOUND, target.toString());
    }
    catch (error) {
      let errorCode = 'OAUTH_LOGIN_FAILED';
      if (error instanceof Error && 'code' in error && typeof error.code === 'string') errorCode = error.code;
      else if (error instanceof Error && error.message === 'OAUTH_PROVIDER_CANCELLED') errorCode = 'OAUTH_CANCELLED';
      const target = new URL(redirectUrl);
      target.searchParams.set('error', errorCode);
      response.redirect(HttpStatus.FOUND, target.toString());
    }
  }

  private callbackUrl(providerId: string): string {
    if (!env.SERVICE_WEB_URL) throw new ApplicationError({ code: 'OAUTH_REDIRECT_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    return new URL(`${API_BASE_PATH}/auth/oauth/${encodeURIComponent(providerId)}/callback`, env.SERVICE_WEB_URL).toString();
  }

  private frontendCallbackUrl(): string {
    if (!env.SERVICE_WEB_URL) throw new ApplicationError({ code: 'OAUTH_REDIRECT_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    return new URL('/oauth/callback', env.SERVICE_WEB_URL).toString();
  }

  private sanitizeReturnTo(callback: string | undefined): string {
    if (!env.SERVICE_WEB_URL || !callback) return '/qna';
    try {
      const base = new URL(env.SERVICE_WEB_URL);
      const target = new URL(callback, base);
      return target.origin === base.origin ? `${target.pathname}${target.search}${target.hash}` : '/qna';
    }
    catch {
      return '/qna';
    }
  }

  private async setRefreshCookie(tokens: TokenPairResult, response: Response): Promise<void> {
    if (!tokens.refreshToken || !tokens.refreshTokenTtlSeconds) return;
    response.cookie(SECURITY_CONFIG.token.refreshCookieName, tokens.refreshToken, {
      httpOnly: true,
      secure: SECURITY_CONFIG.cookie.secure,
      sameSite: SECURITY_CONFIG.cookie.sameSite,
      path: `${API_BASE_PATH}/auth`,
      maxAge: TimeUtil.ms.second(tokens.refreshTokenTtlSeconds),
    });
  }
}
