import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { NoStore } from '@pkg/server-core/http/decorators/no-store.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { LoginCommand } from '#/modules/auth/session/login.command';
import { LoginRequestDto } from '#/modules/auth/session/login.request.dto';
import { LoginResponseDto } from '#/modules/auth/session/login.response.dto';
import { LogoutCommand } from '#/modules/auth/session/logout.command';
import { LogoutRequestDto } from '#/modules/auth/session/logout.request.dto';
import { LogoutResponseDto } from '#/modules/auth/session/logout.response.dto';
import { RefreshCommand } from '#/modules/auth/session/refresh.command';
import { RefreshRequestDto } from '#/modules/auth/session/refresh.request.dto';
import { RefreshResponseDto } from '#/modules/auth/session/refresh.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthSessionController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_login_v1', summary: '운영자 로그인' })
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
  @ApiOperation({ operationId: 'AuthController_refresh_v1', summary: '로그인 토큰 갱신' })
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
  @ApiOperation({ operationId: 'AuthController_logout_v1', summary: '운영자 로그아웃' })
  @SwaggerApiResponse(LogoutResponseDto)
  async logout(
    @Body() dto: LogoutRequestDto,
  ): Promise<LogoutResponseDto> {
    return this.commandBus.execute<LogoutCommand, LogoutResponseDto>(
      new LogoutCommand(dto),
    );
  }
}
