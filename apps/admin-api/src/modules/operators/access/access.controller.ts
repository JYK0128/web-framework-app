import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { BanOperatorCommand } from '#/modules/operators/access/ban-operator.command';
import { BanOperatorRequestDto } from '#/modules/operators/access/ban-operator.request.dto';
import { BanOperatorResponseDto } from '#/modules/operators/access/ban-operator.response.dto';
import { ResetOperatorTwoFactorCommand } from '#/modules/operators/access/reset-operator-two-factor.command';
import { ResetOperatorTwoFactorRequestDto } from '#/modules/operators/access/reset-operator-two-factor.request.dto';
import { ResetOperatorTwoFactorResponseDto } from '#/modules/operators/access/reset-operator-two-factor.response.dto';
import { UnbanOperatorCommand } from '#/modules/operators/access/unban-operator.command';
import { UnbanOperatorRequestDto } from '#/modules/operators/access/unban-operator.request.dto';
import { UnbanOperatorResponseDto } from '#/modules/operators/access/unban-operator.response.dto';
import { UpdateOperatorRoleCommand } from '#/modules/operators/access/update-operator-role.command';
import { UpdateOperatorRoleRequestDto } from '#/modules/operators/access/update-operator-role.request.dto';
import { UpdateOperatorRoleResponseDto } from '#/modules/operators/access/update-operator-role.response.dto';

@ApiTags('operators')
@UserAuth()
@Controller('operators')
export class OperatorAccessController {
  constructor(private readonly commandBus: CommandBus) {}

  @Permissions(AdminPermission.operator.update)
  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 이용 정지', operationId: 'OperatorsController_banOperator_v1' })
  @SwaggerApiResponse(BanOperatorResponseDto)
  async banOperator(@Param('id') id: string, @Body() input: BanOperatorRequestDto): Promise<BanOperatorResponseDto> {
    return this.commandBus.execute(new BanOperatorCommand({ operatorId: id, data: input }));
  }

  @Permissions(AdminPermission.operator.update)
  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 이용 정지 해제', operationId: 'OperatorsController_unbanOperator_v1' })
  @SwaggerApiResponse(UnbanOperatorResponseDto)
  async unbanOperator(@Param('id') id: string): Promise<UnbanOperatorResponseDto> {
    const request = UnbanOperatorRequestDto.parse({ operatorId: id }).validate();
    return this.commandBus.execute(new UnbanOperatorCommand(request));
  }

  @Permissions(AdminPermission.operator.changeRole)
  @Patch(':id/role')
  @ApiOperation({ summary: '운영자 역할 변경', operationId: 'OperatorsController_updateOperatorRole_v1' })
  @SwaggerApiResponse(UpdateOperatorRoleResponseDto)
  async updateOperatorRole(@Param('id') id: string, @Body() input: UpdateOperatorRoleRequestDto): Promise<UpdateOperatorRoleResponseDto> {
    return this.commandBus.execute(new UpdateOperatorRoleCommand({ operatorId: id, data: input }));
  }

  @Permissions(AdminPermission.operator.reset2fa)
  @Post(':id/2fa/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운영자 2단계 인증 초기화', operationId: 'OperatorsController_resetOperatorTwoFactor_v1' })
  @SwaggerApiResponse(ResetOperatorTwoFactorResponseDto)
  async resetOperatorTwoFactor(@Param('id') id: string): Promise<ResetOperatorTwoFactorResponseDto> {
    const request = ResetOperatorTwoFactorRequestDto.parse({ operatorId: id }).validate();
    return this.commandBus.execute(new ResetOperatorTwoFactorCommand(request));
  }
}
