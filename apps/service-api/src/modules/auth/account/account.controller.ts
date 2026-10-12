import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public, UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { NoStore } from '#/core/http/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { FindIdCommand } from '#/modules/auth/account/find-id.command';
import { FindIdRequestDto } from '#/modules/auth/account/find-id.request.dto';
import { FindIdResponseDto } from '#/modules/auth/account/find-id.response.dto';
import { RegisterCommand } from '#/modules/auth/account/register.command';
import { RegisterRequestDto } from '#/modules/auth/account/register.request.dto';
import { RegisterResponseDto } from '#/modules/auth/account/register.response.dto';
import { UnregisterCommand } from '#/modules/auth/account/unregister.command';
import { UnregisterRequestDto } from '#/modules/auth/account/unregister.request.dto';
import { UnregisterResponseDto } from '#/modules/auth/account/unregister.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthAccountController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'AuthController_register_v1', summary: '서비스 사용자 회원가입 ((app.config.ts 정책 적용))' })
  @SwaggerApiResponse(RegisterResponseDto, HttpStatus.CREATED)
  register(@Body() dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  @Public()
  @Post('account/find')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_findId_v1', summary: '서비스 사용자 계정 찾기' })
  @SwaggerApiResponse(FindIdResponseDto)
  findId(@Body() dto: FindIdRequestDto): Promise<FindIdResponseDto> {
    return this.commandBus.execute(new FindIdCommand(dto));
  }

  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_unregister_v1', summary: '서비스 사용자 계정 탈퇴 (정책 설정 적용)' })
  @SwaggerApiResponse(UnregisterResponseDto)
  unregister(): Promise<UnregisterResponseDto> {
    return this.commandBus.execute(new UnregisterCommand(new UnregisterRequestDto()));
  }
}
