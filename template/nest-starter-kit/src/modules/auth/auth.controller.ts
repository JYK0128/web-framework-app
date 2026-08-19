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
import { AuthTokenService } from '#/common/security/auth-token.service';
import { type AuthPrincipal } from '#/common/security/auth-token.types';
import { AuthUserService } from '#/common/security/auth-user.service';
import { AuthVerificationStore } from '#/common/security/auth-verification.store';

import { AccountLinkCommand, AccountUnlinkCommand, ChangePasswordCommand, Create2FAChallengeCommand, DeferPasswordCommand, Generate2FACommand, LoginCredentialCommand, LoginOAuthCommand, TurnOff2FACommand, TurnOn2FACommand, UserRegisterCommand, UserUnregisterCommand, Verify2FAChallengeCommand } from './commands';
import { OAUTH_STATE_TTL_MS } from './constants/auth-policy.constants';
import { GOOGLE_OAUTH_CONFIG } from './constants/google-oauth.constants';
import { AccountLinkRequestDto, AccountLinkResponseDto, AccountUnlinkRequestDto, AccountUnlinkResponseDto, ChangePasswordRequestDto, ChangePasswordResponseDto, DeferPasswordResponseDto, LoginCredentialRequestDto, LoginCredentialResponseDto, LoginOAuthRequestDto, LoginOAuthResponseDto, LogoutResponseDto, TokenRefreshRequestDto, TokenRefreshResponseDto, TwoFactorGenerateResponseDto, TwoFactorTurnOffResponseDto, TwoFactorTurnOnRequestDto, TwoFactorTurnOnResponseDto, TwoFactorVerifyChallengeRequestDto, TwoFactorVerifyChallengeResponseDto, UserProfileResponseDto, UserRegisterRequestDto, UserRegisterResponseDto, UserUnregisterResponseDto } from './dto';
import { UserProfileQuery } from './queries';
import { GoogleOAuthService } from './services/google-oauth.service';

@Bypass(BypassPolicy.PERMISSION, BypassPolicy.TERM, BypassPolicy.USER_VERIFICATION)
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly authTokenService: AuthTokenService,
    private readonly authVerificationStore: AuthVerificationStore,
    private readonly authUserService: AuthUserService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly cls: ClsService,
  ) {}

  private async getAuthPrincipal(userId: string): Promise<AuthPrincipal> {
    const principal = await this.authUserService.getAuthPrincipal(userId);
    if (!principal) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return principal;
  }

  private async consumeGoogleState(state: string): Promise<boolean> {
    const record = await this.authVerificationStore.consume(`oauth:google:${state}`);
    return record?.value === 'google' && record.expiresAt > Date.now();
  }

  private async completeGoogleLogin(code: string): Promise<LoginOAuthResponseDto> {
    const googleData = await this.googleOAuthService.fetchProfile(code);
    if (!googleData) {
      throw new ApplicationError({ code: 'OAUTH_FAILED', status: HttpStatus.UNAUTHORIZED });
    }

    const { tokenData, profile } = googleData;
    const oauthResult = await this.commandBus.execute(
      new LoginOAuthCommand({
        provider: GOOGLE_OAUTH_CONFIG.provider,
        accountId: profile.id,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
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
      ...await this.authTokenService.issue(await this.getAuthPrincipal(oauthResult.userId)),
    };
  }

  @Public()
  @Get('google')
  async googleLogin(@Res() response: Response): Promise<void> {
    const state = randomHex();
    await this.authVerificationStore.save(
      `oauth:google:${state}`,
      {
        value: 'google',
        expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
      },
      Math.ceil(OAUTH_STATE_TTL_MS / 1000),
    );

    const authorizeUrl = this.googleOAuthService.getAuthorizeUrl(state);
    response.redirect(HttpStatus.FOUND, authorizeUrl);
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
      ...await this.authTokenService.issue(await this.getAuthPrincipal(user.userId)),
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
    let claims: Awaited<ReturnType<AuthTokenService['verifyRefresh']>>;
    try {
      claims = await this.authTokenService.verifyRefresh(input.refreshToken);
    }
    catch {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }

    try {
      return await this.authTokenService.rotate(
        await this.getAuthPrincipal(claims.userId),
        claims,
      );
    }
    catch {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }
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
      ...await this.authTokenService.issue(
        await this.getAuthPrincipal(user.userId),
      ),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(): Promise<LogoutResponseDto> {
    const user = this.cls.get<AuthPrincipal>('user');
    const tokenFamilyId = this.cls.get<string | null>('tokenFamilyId');
    if (user) await this.authTokenService.cutoff(user.id);
    if (tokenFamilyId) {
      await this.authTokenService.revokeRefresh(tokenFamilyId);
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
    const user = this.cls.get<AuthPrincipal>('user');
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const tokenFamilyId = this.cls.get<string | null>('tokenFamilyId');
    const result = await this.commandBus.execute(new UserUnregisterCommand({}));

    await this.authTokenService.cutoff(user.id);
    if (tokenFamilyId) {
      await this.authTokenService.revokeRefresh(tokenFamilyId);
    }

    return result;
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
    const result = await this.commandBus.execute(new ChangePasswordCommand(input));
    const user = this.cls.get<AuthPrincipal>('user');
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const tokenFamilyId = this.cls.get<string | null>('tokenFamilyId');
    await this.authTokenService.cutoff(user.id);
    if (tokenFamilyId) {
      await this.authTokenService.revokeRefresh(tokenFamilyId);
    }

    const tokenPair = await this.authTokenService.issue(
      await this.getAuthPrincipal(user.id),
    );

    return { ...result, ...tokenPair };
  }

  @Post('password/defer')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeferPasswordResponseDto)
  async deferPasswordChange(): Promise<DeferPasswordResponseDto> {
    return this.commandBus.execute(new DeferPasswordCommand());
  }
}
