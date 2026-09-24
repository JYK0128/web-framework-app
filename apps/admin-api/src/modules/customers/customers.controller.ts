import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';
import { maskEmail, maskName } from '@pkg/shared/common';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { BanCustomerRequestDto, CustomerActionResponseDto, CustomerDetailResponseDto, CustomerItemDto, CustomerListResponseDto, GetCustomersRequestDto, UpdateCustomerMemoRequestDto, UpdateCustomerRoleRequestDto } from './dto';

function maskCustomer(customer: CustomerItemDto): CustomerItemDto {
  return { ...customer, name: maskName(customer.name), email: maskEmail(customer.email) };
}

@ApiTags('customers')
@UserAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly internalClient: InternalServiceClient) {}

  @ApiOperation({ summary: '고객 목록 조회' })
  @Permissions(Permission.customer.read)
  @SwaggerApiResponse(CustomerListResponseDto)
  @Get()
  async listCustomers(@Query() query: GetCustomersRequestDto): Promise<CustomerListResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set('search', query.search);
    const result = await this.internalClient.fetchServiceApi<CustomerListResponseDto>(`/api/v1/internal/customers?${params.toString()}`);
    return { ...result, items: result.items.map(maskCustomer) };
  }

  @ApiOperation({ summary: '고객 상세 조회' })
  @Permissions(Permission.customer.read)
  @SwaggerApiResponse(CustomerDetailResponseDto)
  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<CustomerDetailResponseDto> {
    const customer = await this.internalClient.fetchServiceApi<CustomerDetailResponseDto>(`/api/v1/internal/customers/${id}`);
    return maskCustomer(customer);
  }

  @ApiOperation({ summary: '고객 이용 정지' })
  @Permissions(Permission.customer.update)
  @Post(':id/ban')
  @SwaggerApiResponse(CustomerActionResponseDto)
  async banCustomer(@Param('id') id: string, @Body() input: BanCustomerRequestDto): Promise<CustomerActionResponseDto> {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/customers/${id}/ban`, { method: 'POST', body: input });
  }

  @ApiOperation({ summary: '고객 이용 정지 해제' })
  @Permissions(Permission.customer.update)
  @Post(':id/unban')
  @SwaggerApiResponse(CustomerActionResponseDto)
  async unbanCustomer(@Param('id') id: string): Promise<CustomerActionResponseDto> {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/customers/${id}/unban`, { method: 'POST' });
  }

  @ApiOperation({ summary: '고객 삭제' })
  @Permissions(Permission.customer.delete)
  @Delete(':id')
  @SwaggerApiResponse(CustomerActionResponseDto)
  async deleteCustomer(@Param('id') id: string): Promise<CustomerActionResponseDto> {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/customers/${id}`, { method: 'DELETE' });
  }

  @ApiOperation({ summary: '고객 멤버십 변경' })
  @Permissions(Permission.customer.update)
  @Patch(':id/role')
  @SwaggerApiResponse(CustomerActionResponseDto)
  async updateCustomerRole(@Param('id') id: string, @Body() input: UpdateCustomerRoleRequestDto): Promise<CustomerActionResponseDto> {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/customers/${id}/role`, { method: 'PATCH', body: input });
  }

  @ApiOperation({ summary: '고객 내부 메모 변경' })
  @Permissions(Permission.customer.update)
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Patch(':id/memo')
  async updateCustomerMemo(@Param('id') id: string, @Body() input: UpdateCustomerMemoRequestDto): Promise<CustomerActionResponseDto> {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/customers/${id}/memo`, { method: 'PATCH', body: input });
  }
}
