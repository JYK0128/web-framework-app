import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { CreateOperatorCommand } from '~/modules/operator/account/create-operator.command';
import { CreateOperatorRequestDto } from '~/modules/operator/account/create-operator.request.dto';
import { CreateOperatorResponseDto } from '~/modules/operator/account/create-operator.response.dto';
import { DeleteOperatorCommand } from '~/modules/operator/account/delete-operator.command';
import { DeleteOperatorRequestDto } from '~/modules/operator/account/delete-operator.request.dto';
import { DeleteOperatorResponseDto } from '~/modules/operator/account/delete-operator.response.dto';
import { RestoreOperatorCommand } from '~/modules/operator/account/restore-operator.command';
import { RestoreOperatorRequestDto } from '~/modules/operator/account/restore-operator.request.dto';
import { RestoreOperatorResponseDto } from '~/modules/operator/account/restore-operator.response.dto';

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
