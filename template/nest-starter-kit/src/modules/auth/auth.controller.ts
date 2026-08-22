import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { randomHex } from '@pkg/shared/server';
import type { Response } from 'express';
import type { AuthPrincipal } from 'express-session';

import { SessionContext } from '#/common/contexts/session.context';
import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SessionStore } from '#/common/stores/session.store';
import { VerificationStore } from '#/common/stores/verification.store';
import { OAuthService } from '#/infra/oauth';

import { AccountLinkCommand, AccountUnlinkCommand, ChangePasswordCommand, DeferPasswordCommand, Generate2FACommand, LoginCredentialCommand, LoginOAuthCommand, TurnOff2FACommand, TurnOn2FACommand, UserRegisterCommand, UserUnregisterCommand, Verify2FAChallengeCommand } from './commands';
import { OAUTH_STATE_TTL_MS } from './constants/auth-policy.constants';
import { AccountLinkRequestDto, AccountLinkResponseDto, AccountUnlinkRequestDto, AccountUnlinkResponseDto, AuthPrincipalResponseDto, ChangePasswordRequestDto, ChangePasswordResponseDto, DeferPasswordResponseDto, LoginCredentialRequestDto, LoginCredentialResponseDto, LoginOAuthRequestDto, LoginOAuthResponseDto, LogoutResponseDto, TwoFactorGenerateResponseDto, TwoFactorTurnOffResponseDto, TwoFactorTurnOnRequestDto, TwoFactorTurnOnResponseDto, TwoFactorVerifyChallengeRequestDto, TwoFactorVerifyChallengeResponseDto, UserRegisterRequestDto, UserRegisterResponseDto, UserUnregisterResponseDto } from './dto';

@Bypass(BypassPolicy.PERMISSION, BypassPolicy.TERM, BypassPolicy.EMAIL_VERIFICATION, BypassPolicy.PHONE_VERIFICATION)
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly sessionContext: SessionContext,
    private readonly sessionStore: SessionStore,
    private readonly verificationStore: VerificationStore,
    private readonly oauthService: OAuthService,
  ) {}

  @Public()
  @Get('google')
  async googleLogin(@Res() res: Response): Promise<void> {
    const state = randomHex();
    await this.verificationStore.save(`oauth:google:${state}`, {
      value: 'google',
      expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
    });
    const url = this.oauthService.createAuthorizeUrl('google', state);
    res.redirect(url);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(LoginCredentialResponseDto)
  async login(
    @Body() input: LoginCredentialRequestDto,
  ): Promise<LoginCredentialResponseDto> {
    return this.commandBus.execute(new LoginCredentialCommand(input));
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(UserRegisterResponseDto, HttpStatus.CREATED)
  async register(
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
    if (input.error || !input.code || !input.state) {
      if (input.state) {
        await this.verificationStore.consume(`oauth:google:${input.state}`).catch(() => null);
      }
      throw new ApplicationError({ code: 'OAUTH_FAILED', status: HttpStatus.UNAUTHORIZED });
    }

    const record = await this.verificationStore.consume(`oauth:google:${input.state}`);
    if (!record || record.value !== 'google' || record.expiresAt <= Date.now()) {
      throw new ApplicationError({ code: 'OAUTH_FAILED', status: HttpStatus.UNAUTHORIZED });
    }

    const token = await this.oauthService.exchangeCode('google', input.code);
    if (!token) {
      throw new ApplicationError({ code: 'OAUTH_FAILED', status: HttpStatus.UNAUTHORIZED });
    }

    const profile = await this.oauthService.fetchProfile('google', token.accessToken);
    if (!profile) {
      throw new ApplicationError({ code: 'OAUTH_FAILED', status: HttpStatus.UNAUTHORIZED });
    }

    return this.commandBus.execute(new LoginOAuthCommand({
      provider: 'google',
      accountId: profile.id,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    }));
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TwoFactorVerifyChallengeResponseDto)
  async verify2FAChallenge(
    @Body() input: TwoFactorVerifyChallengeRequestDto,
  ): Promise<TwoFactorVerifyChallengeResponseDto> {
    return this.commandBus.execute(new Verify2FAChallengeCommand(input));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(): Promise<LogoutResponseDto> {
    await this.sessionContext.destroy();
    return { ok: true };
  }

  @Get('me')
  @SwaggerApiResponse(AuthPrincipalResponseDto)
  userProfile(@CurrentUser() principal: AuthPrincipal): AuthPrincipalResponseDto {
    return principal;
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
  async userUnregister(
    @CurrentUser() user: AuthPrincipal,
  ): Promise<UserUnregisterResponseDto> {
    const result = await this.commandBus.execute(new UserUnregisterCommand({}));
    await this.sessionStore.destroyAll(user.id);
    await this.sessionContext.destroy();

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
  async changePassword(
    @Body() input: ChangePasswordRequestDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<ChangePasswordResponseDto> {
    const result = await this.commandBus.execute(new ChangePasswordCommand(input));
    await this.sessionStore.destroyAll(user.id);
    await this.sessionContext.establish({
      ...user,
      passwordUpdatedAt: new Date(),
      isPasswordChangeRequired: false,
    });

    return result;
  }

  @Post('password/defer')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeferPasswordResponseDto)
  async deferPasswordChange(): Promise<DeferPasswordResponseDto> {
    return this.commandBus.execute(new DeferPasswordCommand());
  }
}
