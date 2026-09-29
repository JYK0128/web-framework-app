import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { API_BASE_PATH, detectEnvironment, TimeUtil } from '@pkg/shared/common';
import type { Response } from 'express';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { RequestContext } from '#/common/contexts/request.context';
import { AllowPasswordExpired, AllowTwoFactorEnrollment, AllowUnverifiedIdentity, Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Cookie } from '#/common/decorators/cookie.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SECURITY_CONFIG } from '#/config';
import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { DisableTwoFactorCommand, EnableTwoFactorCommand, GenerateTwoFactorCommand, LoginCommand, LogoutCommand, RefreshCommand, RegisterCommand, RequestPasswordResetCommand, ResendEmailVerificationCommand, ResetPasswordCommand, VerifyEmailCommand } from '#/modules/auth/commands';
import { AuthPolicyResponseDto, EmailVerificationResponseDto, GenerateTwoFactorResponseDto, LoginRequestDto, LoginResponseDto, LogoutRequestDto, LogoutResponseDto, MeRequestDto, MeResponseDto, PasswordResetAcceptedDto, PasswordResetResponseDto, RefreshRequestDto, RefreshResponseDto, RegisterRequestDto, RegisterResponseDto, RequestPasswordResetDto, ResendEmailVerificationRequestDto, ResendEmailVerificationResponseDto, ResetPasswordDto, TwoFactorCodeRequestDto, TwoFactorStateResponseDto, VerifyEmailRequestDto } from '#/modules/auth/dto';
import { MeQuery } from '#/modules/auth/queries';

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
      passwordMinLength: SECURITY_CONFIG.password.minLength,
      passwordMaxLength: SECURITY_CONFIG.password.maxLength,
      passwordMaxBytes: SECURITY_CONFIG.password.maxBytes,
      passwordRequiresNumbers: SECURITY_CONFIG.password.requireNumbers,
      passwordRequiresSpecialChar: SECURITY_CONFIG.password.requireSpecialChar,
      passwordRequiresUppercase: SECURITY_CONFIG.password.requireUppercase,
      twoFactorAvailable: SECURITY_CONFIG.twoFactor.enabled || SECURITY_CONFIG.twoFactor.required,
      twoFactorCodeLength: SECURITY_CONFIG.twoFactor.codeLength,
    };
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: SECURITY_CONFIG.rateLimit.authenticationMaxRequests, ttl: SECURITY_CONFIG.rateLimit.authenticationWindowMs } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '서비스 사용자 로그인 (Refresh Token + 초단기 JWT 발급)' })
  @SwaggerApiResponse(LoginResponseDto)
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.commandBus.execute<LoginCommand, TokenPairResult>(
      new LoginCommand(dto),
    );

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
      };
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: SECURITY_CONFIG.rateLimit.recoveryMaxRequests, ttl: SECURITY_CONFIG.rateLimit.recoveryWindowMs } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '서비스 사용자 회원가입 (config.ts 정책 적용)' })
  @SwaggerApiResponse(RegisterResponseDto, HttpStatus.CREATED)
  register(@Body() dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  @Public()
  @Post('email-verification/resend')
  @Throttle({ default: { limit: SECURITY_CONFIG.rateLimit.recoveryMaxRequests, ttl: SECURITY_CONFIG.rateLimit.recoveryWindowMs } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 메일 재발송' })
  @SwaggerApiResponse(ResendEmailVerificationResponseDto)
  resendEmailVerification(@Body() dto: ResendEmailVerificationRequestDto): Promise<ResendEmailVerificationResponseDto> {
    return this.commandBus.execute(new ResendEmailVerificationCommand(dto));
  }

  @Public()
  @Post('email-verification/verify')
  @Throttle({ default: { limit: SECURITY_CONFIG.rateLimit.recoveryMaxRequests, ttl: SECURITY_CONFIG.rateLimit.recoveryWindowMs } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 완료' })
  @SwaggerApiResponse(EmailVerificationResponseDto)
  verifyEmail(@Body() dto: VerifyEmailRequestDto): Promise<EmailVerificationResponseDto> {
    return this.commandBus.execute(new VerifyEmailCommand(dto));
  }

  @Public()
  @Post('password/reset/request')
  @Throttle({ default: { limit: SECURITY_CONFIG.rateLimit.recoveryMaxRequests, ttl: SECURITY_CONFIG.rateLimit.recoveryWindowMs } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정 메일 요청' })
  @SwaggerApiResponse(PasswordResetAcceptedDto)
  requestPasswordReset(@Body() dto: RequestPasswordResetDto): Promise<PasswordResetAcceptedDto> {
    return this.commandBus.execute(new RequestPasswordResetCommand(dto));
  }

  @Public()
  @Post('password/reset')
  @Throttle({ default: { limit: SECURITY_CONFIG.rateLimit.recoveryMaxRequests, ttl: SECURITY_CONFIG.rateLimit.recoveryWindowMs } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정 및 암호 정책 검증' })
  @SwaggerApiResponse(PasswordResetResponseDto)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<PasswordResetResponseDto> {
    return this.commandBus.execute(new ResetPasswordCommand(dto));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Token 기반 초단기 AccessToken 갱신 및 토큰 회전' })
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
  @ApiOperation({ summary: '로그아웃 (Refresh Token 무효화)' })
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(
    @Body() dto: LogoutRequestDto,
    @Cookie(SECURITY_CONFIG.token.refreshCookieName) cookieRefreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const refreshToken = cookieRefreshToken ?? dto.refreshToken;
    const result = await this.commandBus.execute<LogoutCommand, LogoutResponseDto>(
      new LogoutCommand(refreshToken),
    );

    res.clearCookie(SECURITY_CONFIG.token.refreshCookieName, { path: `${API_BASE_PATH}/auth` });
    return result;
  }

  @Get('me')
  @AllowPasswordExpired()
  @AllowUnverifiedIdentity()
  @AllowTwoFactorEnrollment()
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인한 사용자 프로필 정보 조회' })
  @SwaggerApiResponse(MeResponseDto)
  async me(
    @Query() query: MeRequestDto,
  ): Promise<MeResponseDto> {
    const user = this.principalContext.ensureUser();
    return this.queryBus.execute<MeQuery, MeResponseDto>(
      new MeQuery({ userId: user.id, query }),
    );
  }

  @Post('two-factor/setup')
  @AllowTwoFactorEnrollment()
  @ApiBearerAuth()
  @ApiOperation({ summary: '2단계 인증 설정용 비밀키 생성' })
  @SwaggerApiResponse(GenerateTwoFactorResponseDto)
  generateTwoFactor(): Promise<GenerateTwoFactorResponseDto> {
    return this.commandBus.execute(new GenerateTwoFactorCommand());
  }

  @Post('two-factor/enable')
  @AllowTwoFactorEnrollment()
  @ApiBearerAuth()
  @ApiOperation({ summary: '2단계 인증 활성화' })
  @SwaggerApiResponse(TwoFactorStateResponseDto)
  enableTwoFactor(@Body() dto: TwoFactorCodeRequestDto): Promise<TwoFactorStateResponseDto> {
    return this.commandBus.execute(new EnableTwoFactorCommand(dto));
  }

  @Post('two-factor/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: '2단계 인증 비활성화' })
  @SwaggerApiResponse(TwoFactorStateResponseDto)
  disableTwoFactor(): Promise<TwoFactorStateResponseDto> {
    return this.commandBus.execute(new DisableTwoFactorCommand());
  }
}
