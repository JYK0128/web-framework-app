import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

@ApiTags('Customers (Control Plane)')
@ApiBearerAuth()
@UserAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly internalClient: InternalServiceClient) {}

  @ApiOperation({ summary: '사용자의 회원 목록 조회 (S2S Machine 경유)' })
  @Get()
  async listCustomers() {
    return this.internalClient.fetchServiceApi('/api/v1/internal/users');
  }

  @ApiOperation({ summary: '사용자의 회원 상세 조회 (S2S Machine 경유)' })
  @Get(':id')
  async getCustomer(@Param('id') id: string) {
    return this.internalClient.fetchServiceApi(`/api/v1/internal/users/${id}`);
  }
}
