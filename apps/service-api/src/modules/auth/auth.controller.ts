import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { detectEnvironment, TimeUtil } from '@pkg/shared/common';
import type { Response } from 'express';

import { SECURITY_CONFIG } from '#/app.config';
import { PrincipalContext } from '#/common/contexts/principal.context';
import { RequestContext } from '#/common/contexts/request.context';
import { AllowPasswordExpired, AllowUnconfiguredTwoFactor, AllowUnverifiedPhoneNumber, Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Cookie } from '#/common/decorators/cookie.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { ChangePasswordCommand, DisableTwoFactorCommand, EnableTwoFactorCommand, GenerateTwoFactorCommand, LoginCommand, type LoginResult, LogoutCommand, RefreshCommand, RegisterCommand, RequestPasswordResetCommand, ResendEmailVerificationCommand, ResetPasswordCommand, TwoFactorLoginCommand, UnregisterCommand, VerifyEmailCommand } from '#/modules/auth/commands';
import { FindIdCommand } from '#/modules/auth/commands/find-id.command';
import { VerifyPhoneNumberCommand } from '#/modules/auth/commands/verify-phone-number.command';
import { ChangePasswordRequestDto, ChangePasswordResponseDto, EmailVerificationResponseDto, EmptyProfileSecurityRequestDto, GenerateTwoFactorResponseDto, LoginRequestDto, LoginResponseDto, LogoutRequestDto, LogoutResponseDto, MeRequestDto, MeResponseDto, PasswordResetAcceptedDto, PasswordResetResponseDto, RefreshRequestDto, RefreshResponseDto, RegisterRequestDto, RegisterResponseDto, RequestPasswordResetDto, ResendEmailVerificationRequestDto, ResendEmailVerificationResponseDto, ResetPasswordDto, TwoFactorCodeRequestDto, TwoFactorLoginRequestDto, TwoFactorStateResponseDto, UnregisterResponseDto, VerifyEmailRequestDto } from '#/modules/auth/dto';
import { FindIdRequestDto, FindIdResponseDto } from '#/modules/auth/dto/account-recovery.dto';
import { VerifyPhoneNumberRequestDto, VerifyPhoneNumberResponseDto } from '#/modules/auth/dto/verify-phone-number.dto';
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

  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @AllowPasswordExpired()
  @AllowUnverifiedPhoneNumber()
  @AllowUnconfiguredTwoFactor()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'PortOne 전화번호 인증 결과 검증 및 계정에 반영' })
  @SwaggerApiResponse(VerifyPhoneNumberResponseDto)
  verifyPhoneNumber(@Body() dto: VerifyPhoneNumberRequestDto): Promise<VerifyPhoneNumberResponseDto> {
    return this.commandBus.execute(new VerifyPhoneNumberCommand(dto));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '서비스 사용자 로그인 (Refresh Token + 초단기 JWT 발급)' })
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
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '서비스 사용자 회원가입 ((app.config.ts 정책 적용))' })
  @SwaggerApiResponse(RegisterResponseDto, HttpStatus.CREATED)
  register(@Body() dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  @Public()
  @Post('account/find')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '서비스 사용자 계정 찾기' })
  @SwaggerApiResponse(FindIdResponseDto)
  findId(@Body() dto: FindIdRequestDto): Promise<FindIdResponseDto> {
    return this.commandBus.execute(new FindIdCommand(dto));
  }

  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '서비스 사용자 계정 탈퇴 (정책 설정 적용)' })
  @SwaggerApiResponse(UnregisterResponseDto)
  unregister(): Promise<UnregisterResponseDto> {
    return this.commandBus.execute(new UnregisterCommand(new EmptyProfileSecurityRequestDto()));
  }

  @Public()
  @Post('email/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 메일 요청' })
  @SwaggerApiResponse(ResendEmailVerificationResponseDto)
  resendEmailVerification(@Body() dto: ResendEmailVerificationRequestDto): Promise<ResendEmailVerificationResponseDto> {
    return this.commandBus.execute(new ResendEmailVerificationCommand(dto));
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 완료' })
  @SwaggerApiResponse(EmailVerificationResponseDto)
  verifyEmail(@Body() dto: VerifyEmailRequestDto): Promise<EmailVerificationResponseDto> {
    return this.commandBus.execute(new VerifyEmailCommand(dto));
  }

  @Public()
  @Post('password/reset/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정 메일 요청' })
  @SwaggerApiResponse(PasswordResetAcceptedDto)
  requestPasswordReset(@Body() dto: RequestPasswordResetDto): Promise<PasswordResetAcceptedDto> {
    return this.commandBus.execute(new RequestPasswordResetCommand(dto));
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정 및 암호 정책 검증' })
  @SwaggerApiResponse(PasswordResetResponseDto)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<PasswordResetResponseDto> {
    return this.commandBus.execute(new ResetPasswordCommand(dto));
  }

  @Post('password/change')
  @AllowPasswordExpired()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '인증된 서비스 사용자의 비밀번호 변경' })
  @SwaggerApiResponse(ChangePasswordResponseDto)
  changePassword(@Body() dto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> {
    return this.commandBus.execute(new ChangePasswordCommand(dto));
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
      new LogoutCommand(Object.assign(new LogoutRequestDto(), { refreshToken })),
    );

    res.clearCookie(SECURITY_CONFIG.token.refreshCookieName);
    return result;
  }

  @Get('me')
  @AllowPasswordExpired()
  @AllowUnverifiedPhoneNumber()
  @AllowUnconfiguredTwoFactor()
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

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @AllowPasswordExpired()
  @AllowUnconfiguredTwoFactor()
  @ApiBearerAuth()
  @ApiOperation({ summary: '2단계 인증 설정용 비밀키 생성' })
  @SwaggerApiResponse(GenerateTwoFactorResponseDto)
  generateTwoFactor(): Promise<GenerateTwoFactorResponseDto> {
    return this.commandBus.execute(new GenerateTwoFactorCommand(new EmptyProfileSecurityRequestDto()));
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @AllowPasswordExpired()
  @AllowUnconfiguredTwoFactor()
  @ApiBearerAuth()
  @ApiOperation({ summary: '2단계 인증 활성화' })
  @SwaggerApiResponse(TwoFactorStateResponseDto)
  enableTwoFactor(@Body() dto: TwoFactorCodeRequestDto): Promise<TwoFactorStateResponseDto> {
    return this.commandBus.execute(new EnableTwoFactorCommand(dto));
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '2단계 인증 비활성화' })
  @SwaggerApiResponse(TwoFactorStateResponseDto)
  disableTwoFactor(): Promise<TwoFactorStateResponseDto> {
    return this.commandBus.execute(new DisableTwoFactorCommand(new EmptyProfileSecurityRequestDto()));
  }
}
