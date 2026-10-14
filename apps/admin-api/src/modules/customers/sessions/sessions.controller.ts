import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/internal-client';
import { GetCustomerSessionsRequestDto } from '#/modules/customers/sessions/get-customer-sessions.request.dto';
import { GetCustomerSessionsResponseDto } from '#/modules/customers/sessions/get-customer-sessions.response.dto';
import { RevokeCustomerSessionRequestDto } from '#/modules/customers/sessions/revoke-customer-session.request.dto';
import { RevokeCustomerSessionResponseDto } from '#/modules/customers/sessions/revoke-customer-session.response.dto';
import { RevokeCustomerSessionsRequestDto } from '#/modules/customers/sessions/revoke-customer-sessions.request.dto';
import { RevokeCustomerSessionsResponseDto } from '#/modules/customers/sessions/revoke-customer-sessions.response.dto';

@ApiTags('customers')
@UserAuth()
@Controller('customers')
export class CustomerSessionsController {
  constructor(private readonly internalClient: InternalClient) {}

  @ApiOperation({ summary: '고객 로그인 세션 조회', operationId: 'CustomersController_listCustomerSessions_v1' })
  @Permissions(AdminPermission.customer.read)
  @SwaggerApiResponse(GetCustomerSessionsResponseDto)
  @Get(':id/sessions')
  async listCustomerSessions(@Param('id') id: string): Promise<GetCustomerSessionsResponseDto> {
    const request = GetCustomerSessionsRequestDto.parse({ customerId: id }).validate();
    return this.internalClient.fetch(`/internal/customers/${request.customerId}/sessions`);
  }

  @ApiOperation({ summary: '고객 특정 세션 해제', operationId: 'CustomersController_revokeCustomerSession_v1' })
  @Permissions(AdminPermission.customer.update)
  @SwaggerApiResponse(RevokeCustomerSessionResponseDto)
  @Delete(':id/sessions/:familyId')
  async revokeCustomerSession(@Param('id') id: string, @Param('familyId') familyId: string): Promise<RevokeCustomerSessionResponseDto> {
    const request = RevokeCustomerSessionRequestDto.parse({ customerId: id, familyId }).validate();
    return this.internalClient.fetch(`/internal/customers/${request.customerId}/sessions/${request.familyId}`, { method: 'DELETE' });
  }

  @ApiOperation({ summary: '고객 전체 세션 해제', operationId: 'CustomersController_revokeCustomerSessions_v1' })
  @Permissions(AdminPermission.customer.update)
  @SwaggerApiResponse(RevokeCustomerSessionsResponseDto)
  @Delete(':id/sessions')
  async revokeCustomerSessions(@Param('id') id: string): Promise<RevokeCustomerSessionsResponseDto> {
    const request = RevokeCustomerSessionsRequestDto.parse({ customerId: id }).validate();
    return this.internalClient.fetch(`/internal/customers/${request.customerId}/sessions`, { method: 'DELETE' });
  }
}
