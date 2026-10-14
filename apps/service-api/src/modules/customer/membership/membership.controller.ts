import { Body, Controller, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { UpdateCustomerRoleCommand } from '#/modules/customer/membership/update-customer-role.command';
import { UpdateCustomerRoleRequestDto } from '#/modules/customer/membership/update-customer-role.request.dto';
import { UpdateCustomerRoleResponseDto } from '#/modules/customer/membership/update-customer-role.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/customers')
export class InternalCustomerMembershipController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ operationId: 'InternalCustomersController_updateCustomerRole_v1', summary: 'Machine: 고객 멤버십 변경' })
  @SwaggerApiResponse(UpdateCustomerRoleResponseDto)
  @Patch(':id/role')
  async updateCustomerRole(@Param('id') id: string, @Body() input: UpdateCustomerRoleRequestDto): Promise<UpdateCustomerRoleResponseDto> {
    return this.commandBus.execute(new UpdateCustomerRoleCommand({ customerId: id, dto: input }));
  }
}
