import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationError, randomHex } from '@pkg/shared/common';
import type { Response } from 'express';

import { SessionContext } from '#/common/contexts/session.context';
import { SystemContext } from '#/common/contexts/system.context';
import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SessionStore } from '#/common/stores/session.store';
import { VerificationStore } from '#/common/stores/verification.store';
import { OAuthService } from '#/infra/oauth';

import { AccountLinkCommand, AccountUnlinkCommand, ChangePasswordCommand, DeferPasswordCommand, Generate2FACommand, IssueEmailChangeChallengeCommand, IssuePasswordResetChallengeCommand, IssuePhoneChangeChallengeCommand, LoginCredentialCommand, LoginOAuthCommand, ResetPasswordCommand, SyncAnalyticsConsentCommand, TurnOff2FACommand, TurnOn2FACommand, UserRegisterCommand, UserUnregisterCommand, Verify2FAChallengeCommand, VerifyEmailChangeCommand, VerifyIdentityPhoneChangeCommand } from './commands';
import { AccountLinkRequestDto, AccountLinkResponseDto, AccountUnlinkRequestDto, AccountUnlinkResponseDto, AuthPrincipalResponseDto, ChangePasswordRequestDto, ChangePasswordResponseDto, DeferPasswordResponseDto, FindIdRequestDto, FindIdResponseDto, GetEnabledProvidersResponseDto, IssueEmailChangeChallengeRequestDto, IssueEmailChangeChallengeResponseDto, IssuePasswordResetChallengeRequestDto, IssuePasswordResetChallengeResponseDto, IssuePhoneChangeChallengeRequestDto, IssuePhoneChangeChallengeResponseDto, LoginCredentialRequestDto, LoginCredentialResponseDto, LoginOAuthRequestDto, LoginOAuthResponseDto, LogoutResponseDto, ResetPasswordRequestDto, ResetPasswordResponseDto, SyncAnalyticsConsentRequestDto, SyncAnalyticsConsentResponseDto, TwoFactorGenerateResponseDto, TwoFactorTurnOffResponseDto, TwoFactorTurnOnRequestDto, TwoFactorTurnOnResponseDto, TwoFactorVerifyChallengeRequestDto, TwoFactorVerifyChallengeResponseDto, UserRegisterRequestDto, UserRegisterResponseDto, UserUnregisterResponseDto, VerifyEmailChangeRequestDto, VerifyEmailChangeResponseDto, VerifyIdentityPhoneChangeRequestDto, VerifyIdentityPhoneChangeResponseDto, VerifyPasswordResetTokenRequestDto, VerifyPasswordResetTokenResponseDto } from './dto';
import { FindIdQuery, VerifyPasswordResetTokenQuery } from './queries';

function resolveOAuthErrorCode(err: unknown): string {
  if (err instanceof ApplicationError && err.code) {
    return err.code;
  }
  if (typeof err === 'object' && err !== null && 'code' in err && typeof (err).code === 'string') {
    return (err as { code: string }).code;
  }
  return 'oauth_login_failed';
}

@Bypass(BypassPolicy.PERMISSION, BypassPolicy.TERM, BypassPolicy.EMAIL_VERIFICATION, BypassPolicy.PHONE_VERIFICATION)
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly systemContext: SystemContext,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly sessionContext: SessionContext,
    private readonly sessionStore: SessionStore,
    private readonly verificationStore: VerificationStore,
    private readonly oauthService: OAuthService,
  ) {}

  @Public()
  @Get('providers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '활성화된 OAuth 로그인 제공자 목록 조회',
    description: '시스템 설정에서 활성화되고 인증 정보가 구성된 OAuth 제공자 목록을 반환합니다.',
  })
  @SwaggerApiResponse(GetEnabledProvidersResponseDto)
  async getEnabledProviders(): Promise<GetEnabledProvidersResponseDto> {
    const items = await this.oauthService.getEnabledProvidersWithMeta();
    return {
      providers: items.map((i) => i.id),
      items,
    };
  }

  @Public()
  @Get('oauth/:provider')
  @ApiOperation({
    summary: '동적 OAuth 인가 요청',
    description: '지정된 OAuth 제공자(google, kakao, naver, github)의 인가 페이지로 리다이렉트합니다.',
  })
  async oauthLogin(
    @Param('provider') provider: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!await this.oauthService.hasProvider(provider)) {
      throw new ApplicationError({ code: 'UNSUPPORTED_PROVIDER', status: HttpStatus.BAD_REQUEST });
    }
    const isEnabled = await this.oauthService.isProviderEnabled(provider);
    if (!isEnabled) {
      throw new ApplicationError({ code: 'PROVIDER_DISABLED', status: HttpStatus.FORBIDDEN });
    }
    const state = randomHex();
    const oauthStateTtlMinutes = await this.systemContext.getOAuthStateTtlMinutes();
    await this.verificationStore.save(`oauth:${provider}:${state}`, {
      value: provider,
      expiresAt: Date.now() + oauthStateTtlMinutes * 60 * 1000,
    });
    const url = await this.oauthService.createAuthorizeUrl(provider, state);
    res.redirect(url);
  }

  @Public()
  @Get('oauth/:provider/callback')
  @ApiOperation({
    summary: '동적 OAuth 로그인 콜백',
    description: '지정된 OAuth 제공자로부터의 인증 코드 및 상태를 검증하고 로그인을 처리한 후 프론트엔드로 리다이렉트합니다.',
  })
  async oauthCallback(
    @Param('provider') provider: string,
    @Query() input: LoginOAuthRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    if (!await this.oauthService.hasProvider(provider)) {
      res.redirect('/login?error=unsupported_provider');
      return;
    }
    const isEnabled = await this.oauthService.isProviderEnabled(provider);
    if (!isEnabled) {
      res.redirect('/login?error=provider_disabled');
      return;
    }

    if (input.error || !input.code) {
      if (input.state) {
        await this.verificationStore.consume(`oauth:${provider}:${input.state}`).catch(() => null);
      }
      res.redirect('/login?error=oauth_failed');
      return;
    }

    const isValidState = await this.validateOAuthState(provider, input.state);
    if (!isValidState) {
      res.redirect('/login?error=oauth_invalid_state');
      return;
    }

    const token = await this.oauthService.exchangeCode(provider, input.code);
    if (!token) {
      res.redirect('/login?error=token_exchange_failed');
      return;
    }

    const profile = await this.oauthService.fetchProfile(provider, token.accessToken);
    if (!profile) {
      res.redirect('/login?error=profile_fetch_failed');
      return;
    }

    try {
      const result = await this.commandBus.execute<LoginOAuthCommand, LoginOAuthResponseDto>(
        new LoginOAuthCommand({
          provider,
          accountId: profile.id,
          email: profile.email,
          name: profile.name || profile.email.split('@')[0],
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        }),
      );

      if (result.challengeId) {
        res.redirect(`/login/2fa?challengeId=${result.challengeId}`);
        return;
      }

      res.redirect('/dashboard');
    }
    catch (err: unknown) {
      res.redirect(`/login?error=${resolveOAuthErrorCode(err)}`);
    }
  }

  private async validateOAuthState(provider: string, state?: string): Promise<boolean> {
    if (!state) return false;
    const record = await this.verificationStore.consume(`oauth:${provider}:${state}`).catch(() => null);
    return Boolean(record && record.value === provider && record.expiresAt > Date.now());
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

  @Post('consent/sync')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(SyncAnalyticsConsentResponseDto)
  async syncAnalyticsConsent(
    @Body() _input: SyncAnalyticsConsentRequestDto,
  ): Promise<SyncAnalyticsConsentResponseDto> {
    return this.commandBus.execute(new SyncAnalyticsConsentCommand(_input));
  }

  @Get('me')
  @SwaggerApiResponse(AuthPrincipalResponseDto)
  me(): AuthPrincipalResponseDto {
    return this.sessionContext.requiredUser;
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
    const user = this.sessionContext.requiredUser;
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
  ): Promise<ChangePasswordResponseDto> {
    const user = this.sessionContext.requiredUser;
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

  @Post('phone/change/challenge')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(IssuePhoneChangeChallengeResponseDto)
  async issuePhoneChangeChallenge(
    @Body() input: IssuePhoneChangeChallengeRequestDto,
  ): Promise<IssuePhoneChangeChallengeResponseDto> {
    return this.commandBus.execute(new IssuePhoneChangeChallengeCommand(input));
  }

  @Post('phone/change/identity')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(VerifyIdentityPhoneChangeResponseDto)
  async verifyIdentityPhoneChange(
    @Body() input: VerifyIdentityPhoneChangeRequestDto,
  ): Promise<VerifyIdentityPhoneChangeResponseDto> {
    return this.commandBus.execute(new VerifyIdentityPhoneChangeCommand(input));
  }

  @Post('email/change/challenge')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(IssueEmailChangeChallengeResponseDto)
  async issueEmailChangeChallenge(
    @Body() input: IssueEmailChangeChallengeRequestDto,
  ): Promise<IssueEmailChangeChallengeResponseDto> {
    return this.commandBus.execute(new IssueEmailChangeChallengeCommand(input));
  }

  @Public()
  @Post('email/change/verify')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(VerifyEmailChangeResponseDto)
  async verifyEmailChange(
    @Body() input: VerifyEmailChangeRequestDto,
  ): Promise<VerifyEmailChangeResponseDto> {
    return this.commandBus.execute(new VerifyEmailChangeCommand(input));
  }

  @Public()
  @Post('account/find-id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '아이디(이메일) 찾기',
    description: '가입 시 등록된 이름과 휴대폰 번호로 마스킹된 이메일 계정 목록을 조회합니다.',
  })
  @SwaggerApiResponse(FindIdResponseDto)
  async findId(
    @Body() input: FindIdRequestDto,
  ): Promise<FindIdResponseDto> {
    return this.queryBus.execute(new FindIdQuery(input));
  }

  @Public()
  @Post('password/reset/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 재설정 인증 메일 발송 요청',
    description: '등록된 이메일 계정으로 비밀번호 재설정 링크를 발송합니다.',
  })
  @SwaggerApiResponse(IssuePasswordResetChallengeResponseDto)
  async issuePasswordResetChallenge(
    @Body() input: IssuePasswordResetChallengeRequestDto,
  ): Promise<IssuePasswordResetChallengeResponseDto> {
    return this.commandBus.execute(new IssuePasswordResetChallengeCommand(input));
  }

  @Public()
  @Get('password/reset/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 재설정 토큰 유효성 검증',
    description: '재설정 링크의 challengeId와 token의 만료 및 유효 상태를 확인합니다.',
  })
  @SwaggerApiResponse(VerifyPasswordResetTokenResponseDto)
  async verifyPasswordResetToken(
    @Query() input: VerifyPasswordResetTokenRequestDto,
  ): Promise<VerifyPasswordResetTokenResponseDto> {
    return this.queryBus.execute(new VerifyPasswordResetTokenQuery(input));
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 재설정 실행',
    description: '검증 토큰과 함께 새로운 비밀번호를 설정하고 기존 세션을 모두 파기합니다.',
  })
  @SwaggerApiResponse(ResetPasswordResponseDto)
  async resetPassword(
    @Body() input: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    return this.commandBus.execute(new ResetPasswordCommand(input));
  }
}
