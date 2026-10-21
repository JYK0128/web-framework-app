import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoStore, Public, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';

import { LoginCommand } from '~/modules/auth/session/login.command';
import { LoginRequestDto } from '~/modules/auth/session/login.request.dto';
import { LoginResponseDto } from '~/modules/auth/session/login.response.dto';
import { LogoutCommand } from '~/modules/auth/session/logout.command';
import { LogoutRequestDto } from '~/modules/auth/session/logout.request.dto';
import { LogoutResponseDto } from '~/modules/auth/session/logout.response.dto';
import { RefreshCommand } from '~/modules/auth/session/refresh.command';
import { RefreshRequestDto } from '~/modules/auth/session/refresh.request.dto';
import { RefreshResponseDto } from '~/modules/auth/session/refresh.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthSessionController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_login_v1', summary: '서비스 사용자 로그인 (Refresh Token + 초단기 JWT 발급)' })
  @SwaggerApiResponse(LoginResponseDto)
  async login(
    @Body() dto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    return this.commandBus.execute<LoginCommand, LoginResponseDto>(
      new LoginCommand(dto),
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_refresh_v1', summary: 'Refresh Token 기반 초단기 AccessToken 갱신 및 토큰 회전' })
  @SwaggerApiResponse(RefreshResponseDto)
  async refresh(
    @Body() dto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    return this.commandBus.execute<RefreshCommand, RefreshResponseDto>(
      new RefreshCommand(dto),
    );
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_logout_v1', summary: '로그아웃 (Refresh Token 무효화)' })
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(
    @Body() dto: LogoutRequestDto,
  ): Promise<LogoutResponseDto> {
    return this.commandBus.execute<LogoutCommand, LogoutResponseDto>(
      new LogoutCommand(dto),
    );
  }
}
