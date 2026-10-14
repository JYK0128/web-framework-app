import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { CreateOperatorCommand } from '#/modules/operators/account/create-operator.command';
import { CreateOperatorRequestDto } from '#/modules/operators/account/create-operator.request.dto';
import { CreateOperatorResponseDto } from '#/modules/operators/account/create-operator.response.dto';
import { DeleteOperatorCommand } from '#/modules/operators/account/delete-operator.command';
import { DeleteOperatorRequestDto } from '#/modules/operators/account/delete-operator.request.dto';
import { DeleteOperatorResponseDto } from '#/modules/operators/account/delete-operator.response.dto';
import { RestoreOperatorCommand } from '#/modules/operators/account/restore-operator.command';
import { RestoreOperatorRequestDto } from '#/modules/operators/account/restore-operator.request.dto';
import { RestoreOperatorResponseDto } from '#/modules/operators/account/restore-operator.response.dto';

@ApiTags('operators')
@UserAuth()
@Controller('operators')
export class OperatorAccountController {
  constructor(private readonly commandBus: CommandBus) {}

  @Permissions(AdminPermission.operator.create)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '운영자 생성', operationId: 'OperatorsController_createOperator_v1' })
  @SwaggerApiResponse(CreateOperatorResponseDto, HttpStatus.CREATED)
  async createOperator(@Body() input: CreateOperatorRequestDto): Promise<CreateOperatorResponseDto> {
    return this.commandBus.execute(new CreateOperatorCommand(input));
  }

  @Permissions(AdminPermission.operator.delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 삭제', operationId: 'OperatorsController_deleteOperator_v1' })
  @SwaggerApiResponse(DeleteOperatorResponseDto)
  async deleteOperator(@Param('id') id: string): Promise<DeleteOperatorResponseDto> {
    const request = DeleteOperatorRequestDto.parse({ operatorId: id }).validate();
    return this.commandBus.execute(new DeleteOperatorCommand(request));
  }

  @Permissions(AdminPermission.operator.restore)
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 복구', operationId: 'OperatorsController_restoreOperator_v1' })
  @SwaggerApiResponse(RestoreOperatorResponseDto)
  async restoreOperator(@Param('id') id: string): Promise<RestoreOperatorResponseDto> {
    const request = RestoreOperatorRequestDto.parse({ operatorId: id }).validate();
    return this.commandBus.execute(new RestoreOperatorCommand(request));
  }
}
