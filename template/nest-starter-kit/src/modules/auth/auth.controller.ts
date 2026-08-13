import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { randomBase64Url } from '@pkg/shared/server';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

import { API_PREFIX, AUTH_ROUTE, SESSION_TTL_SECONDS } from '#/common/constants/app.constants';
import { Cookie } from '#/common/decorators/cookies.decorator';
import { Policy, Protected } from '#/common/decorators/protected.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { cookieNames, getCookieOptions } from '#/common/security/cookie.config';
import { CSRF_HEADER_NAME, generateCsrfToken } from '#/common/security/csrf.config';
import { SessionStore } from '#/common/security/session.store';
import { env } from '#/env';

import { AccountLinkCommand, AccountUnlinkCommand, ChangePasswordCommand, Create2FAChallengeCommand, DeferPasswordCommand, Generate2FACommand, LoginCredentialCommand, LoginOAuthCommand, LogoutCommand, TurnOff2FACommand, TurnOn2FACommand, UserRegisterCommand, UserUnregisterCommand, Verify2FAChallengeCommand } from './commands';
import { TWO_FACTOR_CHALLENGE_TTL_MS } from './constants/auth-policy.constants';
import { GOOGLE_CALLBACK_ROUTE, GOOGLE_OAUTH_CONFIG } from './constants/google-oauth.constants';
import { AccountLinkRequestDto, AccountLinkResponseDto, AccountUnlinkRequestDto, AccountUnlinkResponseDto, ChangePasswordRequestDto, ChangePasswordResponseDto, CsrfResponseDto, DeferPasswordResponseDto, LoginCredentialRequestDto, LoginCredentialResponseDto, LogoutResponseDto, TwoFactorGenerateResponseDto, TwoFactorTurnOffResponseDto, TwoFactorTurnOnRequestDto, TwoFactorTurnOnResponseDto, TwoFactorVerifyChallengeRequestDto, TwoFactorVerifyChallengeResponseDto, UserProfileResponseDto, UserProfileSessionResponseDto, UserRegisterRequestDto, UserRegisterResponseDto, UserUnregisterResponseDto } from './dto';
import { UserProfileQuery } from './queries';

@Controller(AUTH_ROUTE)
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly sessionStore: SessionStore,
    private readonly cls: ClsService,
  ) {}

  private getFrontendUrl(request: Request): string {
    const rawOrigin = request.get('origin') || request.get('referer');
    const matched = rawOrigin && env.CORS_ORIGINS.find((allowed) => allowed !== '*' && rawOrigin.startsWith(allowed));
    return matched || env.CORS_ORIGINS[0] || 'http://localhost:3000';
  }

  private getRedirectUri(request: Request): string {
    const host = request.get('x-forwarded-host') || request.get('host');
    const protocol = request.get('x-forwarded-proto') || request.protocol;
    return `${protocol}://${host}/${API_PREFIX}/${AUTH_ROUTE}/${GOOGLE_CALLBACK_ROUTE}`;
  }

  private async createOAuthState(request: Request): Promise<string> {
    const state = randomBase64Url();
    await this.sessionStore.setOAuthState(request.sessionID, state);
    return state;
  }

  private async consumeOAuthState(request: Request, receivedState: unknown): Promise<boolean> {
    return this.sessionStore.consumeOAuthState(request.sessionID, receivedState);
  }

  private async establishSession(request: Request, response: Response, userId: string): Promise<Date | null> {
    // 추후 로그인 전 게스트 데이터를 회원 계정으로 이전할 때는 이 지점에서 처리한다.
    // 1) request.sessionID(session.token)를 이전 키로 사용해 장바구니·임시 저장 데이터 등을 조회한다.
    // 2) userId를 새 소유자로 지정하고, 중복/수량 병합 규칙을 적용한다.
    // 3) 이전 작업이 성공한 뒤에만 세션을 재생성한다. regenerate()가 기존 세션을 삭제하기 때문이다.
    // 여러 도메인의 데이터는 GuestDataMigrationService 같은 서비스로 묶어 이 메서드에서 호출한다.
    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((regenerateError: unknown) => {
        if (regenerateError) {
          reject(regenerateError instanceof Error ? regenerateError : new Error('Failed to regenerate session'));
          return;
        }

        if (this.cls.isActive()) this.cls.set('sessionId', request.sessionID);
        resolve();
      });
    });

    const expiresAt = SESSION_TTL_SECONDS === -1
      ? null
      : (request.session.cookie.expires ?? new Date(Date.now() + SESSION_TTL_SECONDS * 1000));
    await this.sessionStore.saveAuthenticatedSession(request.sessionID, userId, expiresAt);
    response.setHeader(CSRF_HEADER_NAME, generateCsrfToken(request, response, { overwrite: true }));
    return expiresAt;
  }

  private clearTemporaryCookies(response: Response): void {
    response.clearCookie(cookieNames.twoFactor);
  }

  private expireSession(request: Request, response: Response): Promise<void> {
    this.clearTemporaryCookies(response);
    return new Promise((resolve, reject) => {
      request.session.destroy((destroyError) => {
        if (destroyError) {
          reject(destroyError instanceof Error ? destroyError : new Error('Failed to destroy session'));
          return;
        }

        response.clearCookie(cookieNames.session, getCookieOptions());
        response.clearCookie(cookieNames.csrf, getCookieOptions());
        resolve();
      });
    });
  }

  private async process2FAIfEnabled(userId: string, response: Response): Promise<void> {
    const responseDto = await this.commandBus.execute(
      new Create2FAChallengeCommand({ userId }),
    );

    response.cookie(cookieNames.twoFactor, responseDto.token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TWO_FACTOR_CHALLENGE_TTL_MS,
    });
  }

  private async fetchGoogleProfile(code: string, redirectUri: string) {
    const tokenResponse = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: GOOGLE_OAUTH_CONFIG.grantType,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) return null;
    const tokenData = await tokenResponse.json() as { access_token: string, refresh_token?: string };

    const profileResponse = await fetch(GOOGLE_OAUTH_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) return null;
    const profile = await profileResponse.json() as { id: string, email?: string, name?: string };

    if (!profile.email) return null;
    return { tokenData, profile };
  }

  @Public()
  @Get('csrf')
  @SwaggerApiResponse(CsrfResponseDto)
  getCsrfToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): CsrfResponseDto {
    response.setHeader(CSRF_HEADER_NAME, generateCsrfToken(request, response, { overwrite: true }));
    return { ok: true };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(UserRegisterResponseDto, HttpStatus.CREATED)
  async userRegister(
    @Body() input: UserRegisterRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserRegisterResponseDto> {
    this.clearTemporaryCookies(response);
    const user = await this.commandBus.execute(new UserRegisterCommand(input));
    await this.establishSession(request, response, user.id);
    return { ok: true };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(LoginCredentialResponseDto)
  async loginCredential(
    @Body() input: LoginCredentialRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginCredentialResponseDto> {
    this.clearTemporaryCookies(response);
    const user = await this.commandBus.execute(new LoginCredentialCommand(input));

    if (user.twoFactorEnabled) {
      await this.process2FAIfEnabled(user.id, response);
      return { ok: true, twoFactorRedirect: true };
    }

    await this.establishSession(request, response, user.id);
    return { ok: true };
  }

  @Public()
  @Get('google')
  @HttpCode(HttpStatus.FOUND)
  async googleAuth(@Req() request: Request, @Res() response: Response) {
    const redirectUri = this.getRedirectUri(request);
    const state = await this.createOAuthState(request);
    const url = new URL(GOOGLE_OAUTH_CONFIG.authorizeUrl);
    url.searchParams.append('client_id', env.GOOGLE_CLIENT_ID);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_type', GOOGLE_OAUTH_CONFIG.responseType);
    url.searchParams.append('scope', GOOGLE_OAUTH_CONFIG.scope);
    url.searchParams.append('state', state);

    response.redirect(url.toString());
  }

  @Public()
  @Get(GOOGLE_CALLBACK_ROUTE)
  @HttpCode(HttpStatus.FOUND)
  async googleAuthRedirect(@Req() request: Request, @Res() response: Response) {
    const { code, state } = request.query;
    const frontendUrl = this.getFrontendUrl(request);

    if (!await this.consumeOAuthState(request, state)) {
      return response.redirect(`${frontendUrl}/login?error=oauth_state_invalid`);
    }

    if (!code || typeof code !== 'string') {
      return response.redirect(`${frontendUrl}/login?error=invalid_code`);
    }

    const redirectUri = this.getRedirectUri(request);
    const googleData = await this.fetchGoogleProfile(code, redirectUri);

    if (!googleData) {
      return response.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    const { tokenData, profile } = googleData;
    const oauthResponse = await this.commandBus.execute(
      new LoginOAuthCommand({
        provider: GOOGLE_OAUTH_CONFIG.provider,
        accountId: profile.id,
        email: profile.email!,
        name: profile.name || profile.email!.split('@')[0],
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      }),
    );
    const user = oauthResponse.user;

    if (user.twoFactorEnabled) {
      await this.process2FAIfEnabled(user.id, response);
      return response.redirect(`${frontendUrl}/login/2fa`);
    }

    this.clearTemporaryCookies(response);
    await this.establishSession(request, response, user.id);

    return response.redirect(`${frontendUrl}/onboarding`);
  }

  @Get('me')
  @SwaggerApiResponse(UserProfileSessionResponseDto)
  async userProfile(@Req() request: Request): Promise<UserProfileSessionResponseDto> {
    const user = await this.queryBus.execute<UserProfileQuery, UserProfileResponseDto>(
      new UserProfileQuery({}),
    );
    const expiresAt = request.session.cookie.expires
      ?? (SESSION_TTL_SECONDS === -1 ? null : new Date(Date.now() + SESSION_TTL_SECONDS * 1000));
    return { user, expiresAt };
  }

  @Post('link-account')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(AccountLinkResponseDto)
  async accountLink(@Body() input: AccountLinkRequestDto): Promise<AccountLinkResponseDto> {
    return this.commandBus.execute(new AccountLinkCommand(input));
  }

  @Post('stop-impersonating')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UserProfileSessionResponseDto)
  async stopImpersonating(@Req() request: Request): Promise<UserProfileSessionResponseDto> {
    const result = await this.sessionStore.stopImpersonation(request.sessionID);
    request.session.cookie.maxAge = SESSION_TTL_SECONDS === -1 ? undefined : SESSION_TTL_SECONDS * 1000;
    return {
      user: new UserProfileResponseDto(result.user),
      expiresAt: result.expiresAt,
    };
  }

  @Post('unlink-account')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(AccountUnlinkResponseDto)
  async accountUnlink(@Body() input: AccountUnlinkRequestDto): Promise<AccountUnlinkResponseDto> {
    return this.commandBus.execute(new AccountUnlinkCommand(input));
  }

  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UserUnregisterResponseDto)
  async userUnregister(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserUnregisterResponseDto> {
    await this.commandBus.execute(new UserUnregisterCommand({}));
    await this.expireSession(request, response);
    return { ok: true };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponseDto> {
    await this.commandBus.execute(new LogoutCommand());
    await this.expireSession(request, response);
    return { ok: true };
  }

  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TwoFactorGenerateResponseDto)
  async generate2FA(): Promise<TwoFactorGenerateResponseDto> {
    return this.commandBus.execute(new Generate2FACommand({}));
  }

  @Post('2fa/turn-on')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TwoFactorTurnOnResponseDto)
  async turnOn2FA(@Body() input: TwoFactorTurnOnRequestDto): Promise<TwoFactorTurnOnResponseDto> {
    await this.commandBus.execute(new TurnOn2FACommand(input));
    return { ok: true };
  }

  @Post('2fa/turn-off')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TwoFactorTurnOffResponseDto)
  async turnOff2FA(): Promise<TwoFactorTurnOffResponseDto> {
    await this.commandBus.execute(new TurnOff2FACommand({}));
    return { ok: true };
  }

  @Protected(Policy.TWO_FACTOR)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TwoFactorVerifyChallengeResponseDto)
  async verify2FAChallenge(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Cookie(cookieNames.twoFactor) token: string,
    @Body() input: TwoFactorVerifyChallengeRequestDto,
  ): Promise<TwoFactorVerifyChallengeResponseDto> {
    const user = await this.commandBus.execute(
      new Verify2FAChallengeCommand({ token, code: input.code }),
    );

    response.clearCookie(cookieNames.twoFactor);
    await this.establishSession(request, response, user.id);
    return { ok: true };
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(ChangePasswordResponseDto)
  async changePassword(@Body() input: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> {
    return this.commandBus.execute(new ChangePasswordCommand(input));
  }

  @Post('password/defer')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeferPasswordResponseDto)
  async deferPasswordChange(): Promise<DeferPasswordResponseDto> {
    return this.commandBus.execute(new DeferPasswordCommand());
  }
}
