import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { CustomerDetailResponseDto, CustomerListResponseDto, GetCustomersRequestDto } from './dto';

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
    return this.internalClient.fetchServiceApi(`/api/v1/internal/users?${params.toString()}`);
  }

  @ApiOperation({ summary: '고객 상세 조회' })
  @Permissions(Permission.customer.read)
  @SwaggerApiResponse(CustomerDetailResponseDto)
  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<CustomerDetailResponseDto> {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/users/${id}`);
  }
}
