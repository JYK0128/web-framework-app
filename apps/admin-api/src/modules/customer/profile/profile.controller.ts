import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';
import { maskEmail, maskName } from '@pkg/shared/common';

import { InternalClient } from '~/core/internal-client';
import { CustomerItemDto } from '~/modules/customer/profile/customer-item.dto';
import { GetCustomerRequestDto } from '~/modules/customer/profile/get-customer.request.dto';
import { GetCustomerResponseDto } from '~/modules/customer/profile/get-customer.response.dto';
import { GetCustomerPiiRequestDto } from '~/modules/customer/profile/get-customer-pii.request.dto';
import { GetCustomerPiiResponseDto } from '~/modules/customer/profile/get-customer-pii.response.dto';
import { GetCustomerPiiListRequestDto } from '~/modules/customer/profile/get-customer-pii-list.request.dto';
import { GetCustomerPiiListResponseDto } from '~/modules/customer/profile/get-customer-pii-list.response.dto';
import { GetCustomersRequestDto } from '~/modules/customer/profile/get-customers.request.dto';
import { GetCustomersResponseDto } from '~/modules/customer/profile/get-customers.response.dto';
import { UpdateCustomerMemoRequestDto } from '~/modules/customer/profile/update-customer-memo.request.dto';
import { UpdateCustomerMemoResponseDto } from '~/modules/customer/profile/update-customer-memo.response.dto';

function maskCustomer(customer: CustomerItemDto): CustomerItemDto {
  return CustomerItemDto.parse({ ...customer, name: maskName(customer.name), email: maskEmail(customer.email) });
}

@ApiTags('customers')
@UserAuth()
@Controller('customers')
export class CustomerProfileController {
  constructor(private readonly internalClient: InternalClient) {}

  @ApiOperation({ summary: '고객 목록 조회', operationId: 'CustomersController_listCustomers_v1' })
  @Permissions(AdminPermission.customer.read)
  @SwaggerApiResponse(GetCustomersResponseDto)
  @Get()
  async listCustomers(@Query() query: GetCustomersRequestDto): Promise<GetCustomersResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const field of query.sort) params.append('sort[]', field);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    const result = await this.internalClient.fetch<GetCustomersResponseDto>(`/internal/customers?${params.toString()}`);
    return GetCustomersResponseDto.parse({ ...result, items: result.items.map(maskCustomer) });
  }

  @ApiOperation({ summary: '고객 원본 목록 조회', operationId: 'CustomersController_listCustomerPii_v1' })
  @Permissions(AdminPermission.customer.piiRead)
  @SwaggerApiResponse(GetCustomerPiiListResponseDto)
  @Get('pii')
  async listCustomerPii(@Query() query: GetCustomerPiiListRequestDto): Promise<GetCustomerPiiListResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const field of query.sort) params.append('sort[]', field);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    return this.internalClient.fetch<GetCustomerPiiListResponseDto>(`/internal/customers?${params.toString()}`);
  }

  @ApiOperation({ summary: '고객 상세 조회', operationId: 'CustomersController_getCustomer_v1' })
  @Permissions(AdminPermission.customer.read)
  @SwaggerApiResponse(GetCustomerResponseDto)
  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<GetCustomerResponseDto> {
    const request = GetCustomerRequestDto.parse({ customerId: id }).validate();
    const customer = await this.internalClient.fetch<GetCustomerResponseDto>(`/internal/customers/${request.customerId}`);
    return maskCustomer(customer);
  }

  @ApiOperation({ summary: '고객 개인정보 원문 조회', operationId: 'CustomersController_getCustomerPii_v1' })
  @Permissions(AdminPermission.customer.piiRead)
  @SwaggerApiResponse(GetCustomerPiiResponseDto)
  @Get(':id/pii')
  async getCustomerPii(@Param('id') id: string): Promise<GetCustomerPiiResponseDto> {
    const request = GetCustomerPiiRequestDto.parse({ customerId: id }).validate();
    return this.internalClient.fetch(`/internal/customers/${request.customerId}`);
  }

  @ApiOperation({ summary: '고객 내부 메모 변경', operationId: 'CustomersController_updateCustomerMemo_v1' })
  @Permissions(AdminPermission.customer.update)
  @SwaggerApiResponse(UpdateCustomerMemoResponseDto)
  @Patch(':id/memo')
  async updateCustomerMemo(@Param('id') id: string, @Body() input: UpdateCustomerMemoRequestDto): Promise<UpdateCustomerMemoResponseDto> {
    return this.internalClient.fetch(`/internal/customers/${id}/memo`, { method: 'PATCH', body: input });
  }
}
