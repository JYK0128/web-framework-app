import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoStore, Public, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { ApplicationError } from '@pkg/shared/common';
import type { Response } from 'express';

import { env } from '~/env';
import { OAuthService } from '~/modules/auth/oauth/oauth.service';
import { OAuthCallbackRequestDto } from '~/modules/auth/oauth/oauth-callback.request.dto';
import { OAuthCallbackResponseDto } from '~/modules/auth/oauth/oauth-callback.response.dto';
import { OAuthLoginRequestDto } from '~/modules/auth/oauth/oauth-login.request.dto';
import { OAuthProviderListRequestDto } from '~/modules/auth/oauth/oauth-provider-list.request.dto';
import { OAuthProviderListResponseDto } from '~/modules/auth/oauth/oauth-provider-list.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly oauth: OAuthService) {}

  @Public()
  @Get('providers')
  @ApiOperation({ summary: '활성화된 OAuth 로그인 공급자 조회' })
  @SwaggerApiResponse(OAuthProviderListResponseDto)
  async providers(@Query() _input: OAuthProviderListRequestDto): Promise<OAuthProviderListResponseDto> {
    return OAuthProviderListResponseDto.parse({ items: await this.oauth.getEnabledProviders() });
  }

  @Public()
  @Get(':providerId')
  @ApiOperation({ summary: 'OAuth 로그인 시작' })
  async begin(
    @Param('providerId') providerId: string,
    @Query() input: OAuthLoginRequestDto,
    @Res() response: Response,
  ): Promise<void> {
    const callbackUrl = this.callbackUrl(providerId);
    const redirectUrl = await this.oauth.begin(providerId, callbackUrl, this.sanitizeReturnTo(input.callback));
    response.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Public()
  @Post(':providerId/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '웹 서버의 OAuth 인가 코드 교환' })
  @SwaggerApiResponse(OAuthCallbackResponseDto)
  async callback(
    @Param('providerId') providerId: string,
    @Body() input: OAuthCallbackRequestDto,
  ): Promise<OAuthCallbackResponseDto> {
    const completion = await this.oauth.complete(providerId, input.code, input.state);
    const { accessToken, refreshToken } = completion.tokens;
    if (!accessToken || !refreshToken) throw new ApplicationError({ code: 'OAUTH_LOGIN_FAILED', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return OAuthCallbackResponseDto.parse({ accessToken, refreshToken, returnTo: completion.returnTo });
  }

  private callbackUrl(providerId: string): string {
    return new URL(`/api/v1/auth/oauth/${encodeURIComponent(providerId)}/callback`, env.APP_BASE_URL).toString();
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
}
