import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { BanOperatorCommand, CreateOperatorCommand, DeleteOperatorCommand, ResetOperatorTwoFactorCommand, RestoreOperatorCommand, UnbanOperatorCommand, UpdateOperatorRoleCommand } from './commands';
import { BanOperatorRequestDto, CreateOperatorRequestDto, CreateOperatorResponseDto, GetOperatorByIdResponseDto, GetOperatorOverviewResponseDto, GetOperatorsRequestDto, GetOperatorsResponseDto, OperatorActionResponseDto, UpdateOperatorRoleRequestDto } from './interfaces';
import { GetOperatorByIdQuery, GetOperatorOverviewQuery, GetOperatorsQuery } from './queries';

@ApiTags('operators')
@UserAuth()
@Controller('operators')
export class OperatorsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @Permissions(Permission.operator.read)
  @Get()
  @ApiOperation({ summary: '운영자 목록 조회' })
  @SwaggerApiResponse(GetOperatorsResponseDto)
  async getOperators(@Query() query: GetOperatorsRequestDto): Promise<GetOperatorsResponseDto> {
    return this.queryBus.execute(new GetOperatorsQuery(query));
  }

  @Permissions(Permission.operator.create)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '운영자 생성' })
  @SwaggerApiResponse(CreateOperatorResponseDto, HttpStatus.CREATED)
  async createOperator(@Body() input: CreateOperatorRequestDto): Promise<CreateOperatorResponseDto> {
    return this.commandBus.execute(new CreateOperatorCommand(input));
  }

  @Permissions(Permission.operator.read)
  @Get('overview')
  @ApiOperation({ summary: '운영자 현황 조회' })
  @SwaggerApiResponse(GetOperatorOverviewResponseDto)
  async getOperatorOverview(): Promise<GetOperatorOverviewResponseDto> {
    return this.queryBus.execute(new GetOperatorOverviewQuery());
  }

  @Permissions(Permission.operator.read)
  @Get(':id')
  @ApiOperation({ summary: '운영자 상세 조회' })
  @SwaggerApiResponse(GetOperatorByIdResponseDto)
  async getOperatorById(@Param('id') id: string): Promise<GetOperatorByIdResponseDto> {
    return this.queryBus.execute(new GetOperatorByIdQuery(id));
  }

  @Permissions(Permission.operator.update)
  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 이용 정지' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async banOperator(@Param('id') id: string, @Body() input: BanOperatorRequestDto): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new BanOperatorCommand({ operatorId: id, data: input }));
  }

  @Permissions(Permission.operator.update)
  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 이용 정지 해제' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async unbanOperator(@Param('id') id: string): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new UnbanOperatorCommand(id));
  }

  @Permissions(Permission.operator.delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 삭제' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async deleteOperator(@Param('id') id: string): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new DeleteOperatorCommand(id));
  }

  @Permissions(Permission.operator.restore)
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 복구' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async restoreOperator(@Param('id') id: string): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new RestoreOperatorCommand(id));
  }

  @Permissions(Permission.operator.changeRole)
  @Patch(':id/role')
  @ApiOperation({ summary: '운영자 역할 변경' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async updateOperatorRole(@Param('id') id: string, @Body() input: UpdateOperatorRoleRequestDto): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new UpdateOperatorRoleCommand({ operatorId: id, data: input }));
  }

  @Permissions(Permission.operator.reset2fa)
  @Post(':id/2fa/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 2단계 인증 초기화' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async resetOperatorTwoFactor(@Param('id') id: string): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new ResetOperatorTwoFactorCommand(id));
  }
}
