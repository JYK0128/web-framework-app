import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '~/core/internal-client';
import { BanCustomerRequestDto } from '~/modules/customer/account/ban-customer.request.dto';
import { BanCustomerResponseDto } from '~/modules/customer/account/ban-customer.response.dto';
import { DeleteCustomerRequestDto } from '~/modules/customer/account/delete-customer.request.dto';
import { DeleteCustomerResponseDto } from '~/modules/customer/account/delete-customer.response.dto';
import { UnbanCustomerRequestDto } from '~/modules/customer/account/unban-customer.request.dto';
import { UnbanCustomerResponseDto } from '~/modules/customer/account/unban-customer.response.dto';

@ApiTags('customers')
@UserAuth()
@Controller('customers')
export class CustomerAccountController {
  constructor(private readonly internalClient: InternalClient) {}

  @ApiOperation({ summary: '고객 이용 정지', operationId: 'CustomersController_banCustomer_v1' })
  @Permissions(AdminPermission.customer.update)
  @Post(':id/ban')
  @SwaggerApiResponse(BanCustomerResponseDto)
  async banCustomer(@Param('id') id: string, @Body() input: BanCustomerRequestDto): Promise<BanCustomerResponseDto> {
    return this.internalClient.fetch(`/internal/customers/${id}/ban`, { method: 'POST', body: input });
  }

  @ApiOperation({ summary: '고객 이용 정지 해제', operationId: 'CustomersController_unbanCustomer_v1' })
  @Permissions(AdminPermission.customer.update)
  @Post(':id/unban')
  @SwaggerApiResponse(UnbanCustomerResponseDto)
  async unbanCustomer(@Param('id') id: string): Promise<UnbanCustomerResponseDto> {
    const request = UnbanCustomerRequestDto.parse({ customerId: id }).validate();
    return this.internalClient.fetch(`/internal/customers/${request.customerId}/unban`, { method: 'POST' });
  }

  @ApiOperation({ summary: '고객 삭제', operationId: 'CustomersController_deleteCustomer_v1' })
  @Permissions(AdminPermission.customer.delete)
  @Delete(':id')
  @SwaggerApiResponse(DeleteCustomerResponseDto)
  async deleteCustomer(@Param('id') id: string): Promise<DeleteCustomerResponseDto> {
    const request = DeleteCustomerRequestDto.parse({ customerId: id }).validate();
    return this.internalClient.fetch(`/internal/customers/${request.customerId}`, { method: 'DELETE' });
  }
}
