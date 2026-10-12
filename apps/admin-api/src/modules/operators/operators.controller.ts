import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { BanOperatorRequestDto, CreateOperatorRequestDto, CreateOperatorResponseDto, GetOperatorByIdResponseDto, GetOperatorOverviewResponseDto, GetOperatorsRequestDto, OperatorActionResponseDto, OperatorPageResponseDto, UpdateOperatorRoleRequestDto } from '.';
import { BanOperatorCommand } from './ban-operator.command';
import { CreateOperatorCommand } from './create-operator.command';
import { DeleteOperatorCommand } from './delete-operator.command';
import { GetOperatorByIdQuery } from './get-operator-by-id.query';
import { GetOperatorOverviewQuery } from './get-operator-overview.query';
import { GetOperatorsQuery } from './get-operators.query';
import { ResetOperatorTwoFactorCommand } from './reset-operator-two-factor.command';
import { RestoreOperatorCommand } from './restore-operator.command';
import { UnbanOperatorCommand } from './unban-operator.command';
import { UpdateOperatorRoleCommand } from './update-operator-role.command';

@ApiTags('operators')
@UserAuth()
@Controller('operators')
export class OperatorsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @Permissions(AdminPermission.operator.read)
  @Get()
  @ApiOperation({ summary: '운영자 목록 조회' })
  @SwaggerApiResponse(OperatorPageResponseDto)
  async getOperators(@Query() query: GetOperatorsRequestDto): Promise<OperatorPageResponseDto> {
    return this.queryBus.execute(new GetOperatorsQuery(query));
  }

  @Permissions(AdminPermission.operator.create)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '운영자 생성' })
  @SwaggerApiResponse(CreateOperatorResponseDto, HttpStatus.CREATED)
  async createOperator(@Body() input: CreateOperatorRequestDto): Promise<CreateOperatorResponseDto> {
    return this.commandBus.execute(new CreateOperatorCommand(input));
  }

  @Permissions(AdminPermission.operator.read)
  @Get('overview')
  @ApiOperation({ summary: '운영자 현황 조회' })
  @SwaggerApiResponse(GetOperatorOverviewResponseDto)
  async getOperatorOverview(): Promise<GetOperatorOverviewResponseDto> {
    return this.queryBus.execute(new GetOperatorOverviewQuery());
  }

  @Permissions(AdminPermission.operator.read)
  @Get(':id')
  @ApiOperation({ summary: '운영자 상세 조회' })
  @SwaggerApiResponse(GetOperatorByIdResponseDto)
  async getOperatorById(@Param('id') id: string): Promise<GetOperatorByIdResponseDto> {
    return this.queryBus.execute(new GetOperatorByIdQuery({ operatorId: id }));
  }

  @Permissions(AdminPermission.operator.update)
  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 이용 정지' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async banOperator(@Param('id') id: string, @Body() input: BanOperatorRequestDto): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new BanOperatorCommand({ operatorId: id, data: input }));
  }

  @Permissions(AdminPermission.operator.update)
  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 이용 정지 해제' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async unbanOperator(@Param('id') id: string): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new UnbanOperatorCommand({ operatorId: id }));
  }

  @Permissions(AdminPermission.operator.delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 삭제' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async deleteOperator(@Param('id') id: string): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new DeleteOperatorCommand({ operatorId: id }));
  }

  @Permissions(AdminPermission.operator.restore)
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 복구' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async restoreOperator(@Param('id') id: string): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new RestoreOperatorCommand({ operatorId: id }));
  }

  @Permissions(AdminPermission.operator.changeRole)
  @Patch(':id/role')
  @ApiOperation({ summary: '운영자 역할 변경' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async updateOperatorRole(@Param('id') id: string, @Body() input: UpdateOperatorRoleRequestDto): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new UpdateOperatorRoleCommand({ operatorId: id, data: input }));
  }

  @Permissions(AdminPermission.operator.reset2fa)
  @Post(':id/2fa/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 2단계 인증 초기화' })
  @SwaggerApiResponse(OperatorActionResponseDto)
  async resetOperatorTwoFactor(@Param('id') id: string): Promise<OperatorActionResponseDto> {
    return this.commandBus.execute(new ResetOperatorTwoFactorCommand({ operatorId: id }));
  }
}
