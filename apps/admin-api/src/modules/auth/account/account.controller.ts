import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoStore, Public, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';

import { FindIdQuery } from '~/modules/auth/account/find-id.query';
import { FindIdRequestDto } from '~/modules/auth/account/find-id.request.dto';
import { FindIdResponseDto } from '~/modules/auth/account/find-id.response.dto';
import { RegisterCommand } from '~/modules/auth/account/register.command';
import { RegisterRequestDto } from '~/modules/auth/account/register.request.dto';
import { RegisterResponseDto } from '~/modules/auth/account/register.response.dto';
import { UnregisterCommand } from '~/modules/auth/account/unregister.command';
import { UnregisterRequestDto } from '~/modules/auth/account/unregister.request.dto';
import { UnregisterResponseDto } from '~/modules/auth/account/unregister.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthAccountController {
  constructor(private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'AuthController_register_v1', summary: '운영자 계정 가입 (정책 설정 적용)' })
  @SwaggerApiResponse(RegisterResponseDto, HttpStatus.CREATED)
  register(@Body() dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  @Public()
  @Post('account/find')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_findId_v1', summary: '아이디 찾기' })
  @SwaggerApiResponse(FindIdResponseDto)
  findId(@Body() dto: FindIdRequestDto): Promise<FindIdResponseDto> { return this.queryBus.execute(new FindIdQuery(dto)); }

  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_unregister_v1', summary: '운영자 계정 삭제' })
  @SwaggerApiResponse(UnregisterResponseDto)
  async unregister(): Promise<UnregisterResponseDto> {
    return this.commandBus.execute(new UnregisterCommand(new UnregisterRequestDto()));
  }
}
