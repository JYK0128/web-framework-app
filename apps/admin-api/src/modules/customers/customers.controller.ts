import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

@ApiTags('customers')
@UserAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly internalClient: InternalServiceClient) {}

  @ApiOperation({ summary: '고객 목록 조회' })
  @Get()
  async listCustomers() {
    return this.internalClient.fetchServiceApi('/api/v1/internal/users');
  }

  @ApiOperation({ summary: '고객 상세 조회' })
  @Get(':id')
  async getCustomer(@Param('id') id: string) {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/users/${id}`);
  }
}
