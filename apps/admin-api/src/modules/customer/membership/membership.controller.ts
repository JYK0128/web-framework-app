import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/internal-client';
import { UpdateCustomerRoleRequestDto } from '#/modules/customer/membership/update-customer-role.request.dto';
import { UpdateCustomerRoleResponseDto } from '#/modules/customer/membership/update-customer-role.response.dto';

@ApiTags('customers')
@UserAuth()
@Controller('customers')
export class CustomerMembershipController {
  constructor(private readonly internalClient: InternalClient) {}

  @ApiOperation({ summary: '고객 멤버십 변경', operationId: 'CustomersController_updateCustomerRole_v1' })
  @Permissions(AdminPermission.customer.update)
  @Patch(':id/role')
  @SwaggerApiResponse(UpdateCustomerRoleResponseDto)
  async updateCustomerRole(@Param('id') id: string, @Body() input: UpdateCustomerRoleRequestDto): Promise<UpdateCustomerRoleResponseDto> {
    return this.internalClient.fetch(`/internal/customers/${id}/role`, { method: 'PATCH', body: input });
  }
}
