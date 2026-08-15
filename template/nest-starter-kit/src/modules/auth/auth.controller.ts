import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { randomHex } from '@pkg/shared/server';
import type { Response } from 'express';
import { ClsService } from 'nestjs-cls';

import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AccessTokenService, type AuthLevel } from '#/common/security/access-token.service';
import { AuthCacheService } from '#/common/security/auth-cache.service';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { Verification } from '#/entities/auth/verification.entity';
import { env } from '#/env';

import { AccountLinkCommand, AccountUnlinkCommand, ChangePasswordCommand, Create2FAChallengeCommand, DeferPasswordCommand, Generate2FACommand, LoginCredentialCommand, LoginOAuthCommand, TurnOff2FACommand, TurnOn2FACommand, UserRegisterCommand, UserUnregisterCommand, Verify2FAChallengeCommand } from './commands';
import { OAUTH_STATE_TTL_MS } from './constants/auth-policy.constants';
import { GOOGLE_CALLBACK_ROUTE, GOOGLE_OAUTH_CONFIG } from './constants/google-oauth.constants';
import { AccountLinkRequestDto, AccountLinkResponseDto, AccountUnlinkRequestDto, AccountUnlinkResponseDto, ChangePasswordRequestDto, ChangePasswordResponseDto, DeferPasswordResponseDto, ImpersonationTokenResponseDto, LoginCredentialRequestDto, LoginCredentialResponseDto, LoginOAuthRequestDto, LoginOAuthResponseDto, LogoutResponseDto, TokenRefreshRequestDto, TokenRefreshResponseDto, TwoFactorGenerateResponseDto, TwoFactorTurnOffResponseDto, TwoFactorTurnOnRequestDto, TwoFactorTurnOnResponseDto, TwoFactorVerifyChallengeRequestDto, TwoFactorVerifyChallengeResponseDto, UserProfileResponseDto, UserRegisterRequestDto, UserRegisterResponseDto, UserUnregisterResponseDto } from './dto';
import { UserProfileQuery } from './queries';

@Bypass(BypassPolicy.PERMISSION, BypassPolicy.TERM)
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly em: AppEntityManager,
    private readonly accessTokenService: AccessTokenService,
    private readonly authCacheService: AuthCacheService,
    private readonly cls: ClsService,
  ) {}

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

  private getGoogleCallbackUrl(): string {
    return new URL(GOOGLE_CALLBACK_ROUTE, `${env.FRONTEND_URL.replace(/\/$/, '')}/`).toString();
  }

  private async consumeGoogleState(state: string): Promise<boolean> {
    const verification = await this.em.findOne(Verification, {
      identifier: 'oauth:google',
      value: state,
    });

    if (!verification) return false;
    if (verification.isExpired) {
      this.em.remove(verification);
      return false;
    }

    this.em.remove(verification);
    return true;
  }

  private async completeGoogleLogin(code: string): Promise<LoginOAuthResponseDto> {
    const googleData = await this.fetchGoogleProfile(code, this.getGoogleCallbackUrl());
    if (!googleData) {
      throw new ApplicationError({ code: 'OAUTH_FAILED', status: HttpStatus.UNAUTHORIZED });
    }

    const { tokenData, profile } = googleData;
    const oauthResult = await this.commandBus.execute(
      new LoginOAuthCommand({
        provider: GOOGLE_OAUTH_CONFIG.provider,
        accountId: profile.id,
        email: profile.email!,
        name: profile.name || profile.email!.split('@')[0],
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      }),
    );

    if (oauthResult.twoFactorEnabled) {
      const challenge = await this.commandBus.execute(
        new Create2FAChallengeCommand({ userId: oauthResult.userId }),
      );
      return {
        challengeId: challenge.challengeId,
      };
    }

    return {
      ...await this.accessTokenService.issueTokenPair(oauthResult.userId),
    };
  }

  @Public()
  @Get('google')
  async googleLogin(@Res() response: Response): Promise<void> {
    const state = randomHex();
    const verification = this.em.create(Verification, {
      identifier: 'oauth:google',
      value: state,
      expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
    });
    this.em.persist(verification);

    const authorizeUrl = new URL(GOOGLE_OAUTH_CONFIG.authorizeUrl);
    authorizeUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    authorizeUrl.searchParams.set('redirect_uri', this.getGoogleCallbackUrl());
    authorizeUrl.searchParams.set('response_type', GOOGLE_OAUTH_CONFIG.responseType);
    authorizeUrl.searchParams.set('scope', GOOGLE_OAUTH_CONFIG.scope);
    authorizeUrl.searchParams.set('state', state);

    response.redirect(HttpStatus.FOUND, authorizeUrl.toString());
  }

  @Public()
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(LoginCredentialResponseDto)
  async issueCredentialToken(
    @Body() input: LoginCredentialRequestDto,
  ): Promise<LoginCredentialResponseDto> {
    const user = await this.commandBus.execute(
      new LoginCredentialCommand({
        email: input.email,
        password: input.password,
      }),
    );

    if (user.twoFactorEnabled) {
      const challenge = await this.commandBus.execute(
        new Create2FAChallengeCommand({ userId: user.userId }),
      );
      return {
        challengeId: challenge.challengeId,
      };
    }

    return {
      ...await this.accessTokenService.issueTokenPair(user.userId),
    };
  }

  @Public()
  @Post('token/register')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(UserRegisterResponseDto, HttpStatus.CREATED)
  async registerWithoutSession(
    @Body() input: UserRegisterRequestDto,
  ): Promise<UserRegisterResponseDto> {
    await this.commandBus.execute(new UserRegisterCommand(input));
    return { ok: true };
  }

  @Public()
  @Get('google/callback')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(LoginOAuthResponseDto)
  async googleCallback(
    @Query() input: LoginOAuthRequestDto,
  ): Promise<LoginOAuthResponseDto> {
    if (!await this.consumeGoogleState(input.state)) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }

    return this.completeGoogleLogin(input.code);
  }

  @Public()
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TokenRefreshResponseDto)
  async refreshToken(
    @Body() input: TokenRefreshRequestDto,
  ): Promise<TokenRefreshResponseDto> {
    let claims: Awaited<ReturnType<AccessTokenService['verifyRefreshToken']>>;
    try {
      claims = await this.accessTokenService.verifyRefreshToken(input.refreshToken);
    }
    catch {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: claims.userId }, { filters: false });
    if (!user || user.isBanned || user.isDeleted) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return {
      ...await this.accessTokenService.issueTokenPair(user.id, {
        authLevel: claims.authLevel,
        impersonatedBy: claims.impersonatedBy,
      }),
    };
  }

  @Public()
  @Post('token/2fa/verify')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TwoFactorVerifyChallengeResponseDto)
  async verify2FAChallenge(
    @Body() input: TwoFactorVerifyChallengeRequestDto,
  ): Promise<TwoFactorVerifyChallengeResponseDto> {
    if (!input.challengeId) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.commandBus.execute(
      new Verify2FAChallengeCommand({
        challengeId: input.challengeId,
        code: input.code,
      }),
    );

    return {
      ...await this.accessTokenService.issueTokenPair(user.userId, { authLevel: 'mfa' }),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(): Promise<LogoutResponseDto> {
    const jti = this.cls.get<string>('tokenJti');
    const exp = this.cls.get<number>('tokenExp');
    if (jti && exp) {
      const remainingSeconds = Math.max(1, exp - Math.floor(Date.now() / 1000));
      await this.authCacheService.blacklistToken(jti, remainingSeconds);
    }
    return { ok: true };
  }

  @Get('me')
  @SwaggerApiResponse(UserProfileResponseDto)
  async userProfile(): Promise<UserProfileResponseDto> {
    return this.queryBus.execute<UserProfileQuery, UserProfileResponseDto>(
      new UserProfileQuery({}),
    );
  }

  @Post('link-account')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(AccountLinkResponseDto)
  async accountLink(@Body() input: AccountLinkRequestDto): Promise<AccountLinkResponseDto> {
    return this.commandBus.execute(new AccountLinkCommand(input));
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
  async userUnregister(): Promise<UserUnregisterResponseDto> {
    return this.commandBus.execute(new UserUnregisterCommand({}));
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

  @Post('stop-impersonating')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(ImpersonationTokenResponseDto)
  async stopImpersonating(): Promise<ImpersonationTokenResponseDto> {
    const impersonatorId = this.cls.get('impersonatedBy');
    if (!impersonatorId) {
      throw new ApplicationError({ code: 'IMPERSONATION_NOT_ACTIVE', status: HttpStatus.BAD_REQUEST });
    }

    const user = await this.em.findOne(User, { id: impersonatorId }, { filters: false });
    if (!user || user.isBanned || user.isDeleted) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return {
      userId: user.id,
      user: new UserProfileResponseDto(user),
      ...await this.accessTokenService.issueTokenPair(user.id, {
        authLevel: this.cls.get<AuthLevel>('authLevel'),
      }),
    };
  }
}
