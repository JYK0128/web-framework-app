import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { detectEnvironment, TimeUtil } from '@pkg/shared/common';
import type { Response } from 'express';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { RequestContext } from '#/common/contexts/request.context';
import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Cookie } from '#/common/decorators/cookie.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { ApiResponse } from '#/common/http';
import type { TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { ChangePasswordCommand, DisableTwoFactorCommand, EnableTwoFactorCommand, GenerateTwoFactorCommand, LoginCommand, LogoutCommand, RefreshCommand, UnregisterCommand } from '#/modules/auth/commands';
import { ChangePasswordRequestDto, ChangePasswordResponseDto, DisableTwoFactorResponseDto, EmptyProfileSecurityRequestDto, EnableTwoFactorRequestDto, EnableTwoFactorResponseDto, GenerateTwoFactorResponseDto, LoginRequestDto, LoginResponseDto, LogoutRequestDto, LogoutResponseDto, MeRequestDto, MeResponseDto, RefreshRequestDto, RefreshResponseDto, UnregisterResponseDto } from '#/modules/auth/interfaces';
import { MeQuery } from '#/modules/auth/queries';

import { AccountRecoveryService } from './account-recovery.service';
import { FindIdRequestDto, FindIdResponseDto, PasswordResetRequestDto, PasswordResetRequestResponseDto, ResetPasswordDto, VerifyPasswordResetDto, VerifyPasswordResetResponseDto } from './interfaces/account-recovery.dto';

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
    private readonly accountRecovery: AccountRecoveryService,
  ) {}

  @Public()
  @Post('find-id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(FindIdResponseDto)
  async findId(@Body() dto: FindIdRequestDto): Promise<FindIdResponseDto> { return this.accountRecovery.findIds(dto.name, dto.phoneNumber); }

  @Public()
  @Post('password/reset/request')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(PasswordResetRequestResponseDto)
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    await this.accountRecovery.requestPasswordReset(dto.email, dto.phoneNumber);
    return ApiResponse.success({}, 'PASSWORD_RESET_REQUESTED');
  }

  @Public()
  @Get('password/reset/verify')
  @SwaggerApiResponse(VerifyPasswordResetResponseDto)
  async verifyPasswordReset(@Query() dto: VerifyPasswordResetDto): Promise<VerifyPasswordResetResponseDto> { return this.accountRecovery.verifyPasswordReset(dto.challengeId, dto.token); }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(PasswordResetRequestResponseDto)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.accountRecovery.resetPassword(dto.challengeId, dto.token, dto.newPassword);
    return ApiResponse.success({}, 'PASSWORD_RESET_COMPLETED');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사내 관리자 로그인 (Refresh Token + 초단기 JWT 발급)' })
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
    const cookieMaxAge = dto.rememberMe ? TimeUtil.ms.day(30) : TimeUtil.ms.minute(30);

    if ((env.isWebBrowser || env.isWebView) && result.refreshToken) {
      res.cookie('admin_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: cookieMaxAge,
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
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Token 기반 초단기 AccessToken 갱신 및 토큰 회전' })
  @SwaggerApiResponse(RefreshResponseDto)
  async refresh(
    @Body() dto: RefreshRequestDto,
    @Cookie('admin_refresh_token') cookieRefreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = dto.refreshToken ?? cookieRefreshToken;
    const result = await this.commandBus.execute<RefreshCommand, TokenPairResult>(
      new RefreshCommand(dto, refreshToken),
    );

    const env = detectEnvironment(this.requestContext.userAgent ?? undefined);
    if (env.isWebBrowser || env.isWebView) {
      if (result.refreshToken && result.refreshTokenTtlSeconds) {
        res.cookie('admin_refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/api/v1/auth',
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
  @ApiOperation({ summary: '관리자 로그아웃 (Refresh Token 무효화)' })
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(
    @Body() dto: LogoutRequestDto,
    @Cookie('admin_refresh_token') cookieRefreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const refreshToken = cookieRefreshToken ?? dto.refreshToken;
    const result = await this.commandBus.execute<LogoutCommand, LogoutResponseDto>(
      new LogoutCommand(refreshToken),
    );

    res.clearCookie('admin_refresh_token', { path: '/api/v1/auth' });
    return result;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인한 관리자 프로필 정보 조회' })
  @SwaggerApiResponse(MeResponseDto)
  async me(
    @Query() query: MeRequestDto,
  ): Promise<MeResponseDto> {
    const user = this.principalContext.ensureUser();
    return this.queryBus.execute<MeQuery, MeResponseDto>(
      new MeQuery({ userId: user.id, query }),
    );
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(ChangePasswordResponseDto)
  async changePassword(@Body() dto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> {
    return this.commandBus.execute(new ChangePasswordCommand(dto));
  }

  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(GenerateTwoFactorResponseDto)
  async generateTwoFactor(): Promise<GenerateTwoFactorResponseDto> {
    return this.commandBus.execute(new GenerateTwoFactorCommand(new EmptyProfileSecurityRequestDto()));
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(EnableTwoFactorResponseDto)
  async enableTwoFactor(@Body() dto: EnableTwoFactorRequestDto): Promise<EnableTwoFactorResponseDto> {
    return this.commandBus.execute(new EnableTwoFactorCommand(dto));
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DisableTwoFactorResponseDto)
  async disableTwoFactor(): Promise<DisableTwoFactorResponseDto> {
    return this.commandBus.execute(new DisableTwoFactorCommand(new EmptyProfileSecurityRequestDto()));
  }

  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UnregisterResponseDto)
  async unregister(): Promise<UnregisterResponseDto> {
    return this.commandBus.execute(new UnregisterCommand(new EmptyProfileSecurityRequestDto()));
  }
}
