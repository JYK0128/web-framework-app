import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_BASE_PATH, detectEnvironment, TimeUtil } from '@pkg/shared/common';
import type { Response } from 'express';

import { SECURITY_CONFIG } from '#/app.config';
import { PrincipalContext } from '#/common/contexts/principal.context';
import { RequestContext } from '#/common/contexts/request.context';
import { AllowPasswordExpired, AllowTwoFactorEnrollment, AllowUnverifiedPhoneNumber, Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Cookie } from '#/common/decorators/cookie.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { ChangePasswordCommand, DisableTwoFactorCommand, EnableTwoFactorCommand, FindIdCommand, GenerateTwoFactorCommand, LoginCommand, type LoginResult, LogoutCommand, RefreshCommand, RegisterCommand, RequestEmailVerificationCommand, RequestPasswordResetCommand, ResetPasswordCommand, TwoFactorLoginCommand, UnregisterCommand, VerifyEmailCommand } from '#/modules/auth/commands';
import { VerifyPhoneNumberCommand } from '#/modules/auth/commands/verify-phone-number.command';
import { AuthPolicyResponseDto, ChangePasswordRequestDto, ChangePasswordResponseDto, DisableTwoFactorResponseDto, EmptyProfileSecurityRequestDto, EnableTwoFactorRequestDto, EnableTwoFactorResponseDto, GenerateTwoFactorResponseDto, LoginRequestDto, LoginResponseDto, LogoutRequestDto, LogoutResponseDto, MeRequestDto, MeResponseDto, RefreshRequestDto, RefreshResponseDto, TwoFactorLoginRequestDto, UnregisterResponseDto } from '#/modules/auth/interfaces';
import { VerifyPhoneNumberRequestDto, VerifyPhoneNumberResponseDto } from '#/modules/auth/interfaces/verify-phone-number.dto';
import { MeQuery } from '#/modules/auth/queries';

import { EmailVerificationRequestDto, EmailVerificationRequestResponseDto, FindIdRequestDto, FindIdResponseDto, PasswordResetRequestDto, PasswordResetRequestResponseDto, PasswordResetResponseDto, ResetPasswordDto, VerifyEmailDto, VerifyEmailResponseDto } from './interfaces/account-recovery.dto';
import { RegisterRequestDto, RegisterResponseDto } from './interfaces/registration.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly principalContext: PrincipalContext,
    private readonly requestContext: RequestContext,
  ) {}

  @Public()
  @Get('policy')
  @ApiOperation({ summary: '공개 인증 정책 조회' })
  @SwaggerApiResponse(AuthPolicyResponseDto)
  getPolicy(): AuthPolicyResponseDto {
    return {
      registrationAvailable: SECURITY_CONFIG.registration.allowRegistration,
      credentialRegistrationAvailable: SECURITY_CONFIG.registration.allowRegistration && SECURITY_CONFIG.registration.allowCredentialRegistration,
      unregistrationAvailable: SECURITY_CONFIG.registration.allowUnregistration,
      emailVerificationRequired: SECURITY_CONFIG.registration.requireEmailVerification,
      phoneNumberVerificationRequired: SECURITY_CONFIG.registration.requirePhoneNumberVerification,
      passwordMinLength: SECURITY_CONFIG.password.minLength,
      passwordMaxLength: SECURITY_CONFIG.password.maxLength,
      passwordMaxBytes: SECURITY_CONFIG.password.maxBytes,
      passwordRequiresNumbers: SECURITY_CONFIG.password.requireNumbers,
      passwordRequiresSpecialChar: SECURITY_CONFIG.password.requireSpecialChar,
      passwordRequiresUppercase: SECURITY_CONFIG.password.requireUppercase,
      twoFactorRequired: SECURITY_CONFIG.twoFactor.required,
      twoFactorDigits: SECURITY_CONFIG.twoFactor.digits,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '운영자 계정 가입 (정책 설정 적용)' })
  @SwaggerApiResponse(RegisterResponseDto, HttpStatus.CREATED)
  register(@Body() dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  @Public()
  @Post('account/find')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '아이디 찾기' })
  @SwaggerApiResponse(FindIdResponseDto)
  findId(@Body() dto: FindIdRequestDto): Promise<FindIdResponseDto> { return this.commandBus.execute(new FindIdCommand(dto)); }

  @Public()
  @Post('email/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 메일 요청' })
  @SwaggerApiResponse(EmailVerificationRequestResponseDto)
  requestEmailVerification(@Body() dto: EmailVerificationRequestDto): Promise<EmailVerificationRequestResponseDto> {
    return this.commandBus.execute(new RequestEmailVerificationCommand(dto));
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 이메일 인증 완료' })
  @SwaggerApiResponse(VerifyEmailResponseDto)
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    return this.commandBus.execute(new VerifyEmailCommand(dto));
  }

  @Public()
  @Post('password/reset/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정 요청' })
  @SwaggerApiResponse(PasswordResetRequestResponseDto)
  requestPasswordReset(@Body() dto: PasswordResetRequestDto): Promise<PasswordResetRequestResponseDto> {
    return this.commandBus.execute(new RequestPasswordResetCommand(dto));
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정' })
  @SwaggerApiResponse(PasswordResetResponseDto)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<PasswordResetResponseDto> {
    return this.commandBus.execute(new ResetPasswordCommand(dto));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 로그인' })
  @SwaggerApiResponse(LoginResponseDto)
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.commandBus.execute<LoginCommand, LoginResult>(
      new LoginCommand(dto),
    );

    return this.createLoginResponse(result, res);
  }

  @Public()
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2단계 인증 코드로 로그인 완료' })
  @SwaggerApiResponse(LoginResponseDto)
  async completeTwoFactorLogin(
    @Body() dto: TwoFactorLoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.commandBus.execute<TwoFactorLoginCommand, TokenPairResult>(
      new TwoFactorLoginCommand(dto),
    );
    return this.createLoginResponse({ ...result, requiresTwoFactor: false }, res);
  }

  private createLoginResponse(result: LoginResult, res: Response): LoginResponseDto {
    if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
      return {
        requiresTwoFactor: true,
        twoFactorChallengeToken: result.twoFactorChallengeToken,
      };
    }

    const userAgent = this.requestContext.userAgent ?? undefined;
    const env = detectEnvironment(userAgent);
    if ((env.isWebBrowser || env.isWebView) && result.refreshToken && result.refreshTokenTtlSeconds) {
      res.cookie(SECURITY_CONFIG.token.refreshCookieName, result.refreshToken, {
        httpOnly: true,
        secure: SECURITY_CONFIG.cookie.secure,
        sameSite: SECURITY_CONFIG.cookie.sameSite,
        path: `${API_BASE_PATH}/auth`,
        maxAge: TimeUtil.ms.second(result.refreshTokenTtlSeconds),
      });

      return {
        accessToken: result.accessToken,
        requiresTwoFactor: false,
      };
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      requiresTwoFactor: false,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인 토큰 갱신' })
  @SwaggerApiResponse(RefreshResponseDto)
  async refresh(
    @Body() dto: RefreshRequestDto,
    @Cookie(SECURITY_CONFIG.token.refreshCookieName) cookieRefreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = dto.refreshToken ?? cookieRefreshToken;
    const result = await this.commandBus.execute<RefreshCommand, TokenPairResult>(
      new RefreshCommand(dto, refreshToken),
    );

    const env = detectEnvironment(this.requestContext.userAgent ?? undefined);
    if (env.isWebBrowser || env.isWebView) {
      if (result.refreshToken && result.refreshTokenTtlSeconds) {
        res.cookie(SECURITY_CONFIG.token.refreshCookieName, result.refreshToken, {
          httpOnly: true,
          secure: SECURITY_CONFIG.cookie.secure,
          sameSite: SECURITY_CONFIG.cookie.sameSite,
          path: `${API_BASE_PATH}/auth`,
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
  @ApiOperation({ summary: '운영자 로그아웃' })
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(
    @Body() dto: LogoutRequestDto,
    @Cookie(SECURITY_CONFIG.token.refreshCookieName) cookieRefreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const refreshToken = cookieRefreshToken ?? dto.refreshToken;
    const result = await this.commandBus.execute<LogoutCommand, LogoutResponseDto>(
      new LogoutCommand(Object.assign(new LogoutRequestDto(), { refreshToken })),
    );

    res.clearCookie(SECURITY_CONFIG.token.refreshCookieName, { path: `${API_BASE_PATH}/auth` });
    return result;
  }

  @Get('me')
  @AllowPasswordExpired()
  @AllowTwoFactorEnrollment()
  @AllowUnverifiedPhoneNumber()
  @ApiOperation({ summary: '내 정보 조회' })
  @SwaggerApiResponse(MeResponseDto)
  async me(
    @Query() query: MeRequestDto,
  ): Promise<MeResponseDto> {
    const user = this.principalContext.ensureUser();
    return this.queryBus.execute<MeQuery, MeResponseDto>(
      new MeQuery({ userId: user.id, query }),
    );
  }

  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @AllowTwoFactorEnrollment()
  @AllowUnverifiedPhoneNumber()
  @ApiOperation({ summary: 'PortOne 본인인증 결과 검증 및 관리자 계정에 반영' })
  @SwaggerApiResponse(VerifyPhoneNumberResponseDto)
  verifyPhoneNumber(@Body() dto: VerifyPhoneNumberRequestDto): Promise<VerifyPhoneNumberResponseDto> {
    return this.commandBus.execute(new VerifyPhoneNumberCommand(dto));
  }

  @Post('password/change')
  @AllowPasswordExpired()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 변경' })
  @SwaggerApiResponse(ChangePasswordResponseDto)
  async changePassword(@Body() dto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> {
    return this.commandBus.execute(new ChangePasswordCommand(dto));
  }

  @Post('2fa/setup')
  @AllowTwoFactorEnrollment()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2단계 인증 코드 생성' })
  @SwaggerApiResponse(GenerateTwoFactorResponseDto)
  async generateTwoFactor(): Promise<GenerateTwoFactorResponseDto> {
    return this.commandBus.execute(new GenerateTwoFactorCommand(new EmptyProfileSecurityRequestDto()));
  }

  @Post('2fa/enable')
  @AllowTwoFactorEnrollment()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2단계 인증 켜기' })
  @SwaggerApiResponse(EnableTwoFactorResponseDto)
  async enableTwoFactor(@Body() dto: EnableTwoFactorRequestDto): Promise<EnableTwoFactorResponseDto> {
    return this.commandBus.execute(new EnableTwoFactorCommand(dto));
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2단계 인증 끄기' })
  @SwaggerApiResponse(DisableTwoFactorResponseDto)
  async disableTwoFactor(): Promise<DisableTwoFactorResponseDto> {
    return this.commandBus.execute(new DisableTwoFactorCommand(new EmptyProfileSecurityRequestDto()));
  }

  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 계정 삭제' })
  @SwaggerApiResponse(UnregisterResponseDto)
  async unregister(): Promise<UnregisterResponseDto> {
    return this.commandBus.execute(new UnregisterCommand(new EmptyProfileSecurityRequestDto()));
  }
}
