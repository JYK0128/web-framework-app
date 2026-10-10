import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import type { Response } from 'express';

import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { env } from '#/env';
import { OAuthCallbackRequestDto, OAuthCallbackResponseDto, OAuthProviderListResponseDto } from '#/modules/auth/dto';
import { OAuthService } from '#/modules/auth/oauth.service';

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
    return OAuthCallbackResponseDto.fromPlain({ accessToken, refreshToken, returnTo: completion.returnTo });
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
