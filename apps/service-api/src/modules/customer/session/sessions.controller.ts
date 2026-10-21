import { Controller, Delete, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenStore } from '@pkg/server-core/auth';
import { MachineAuth, SwaggerApiResponse } from '@pkg/server-core/http/decorators';
import { ApplicationError } from '@pkg/shared/common';

import { GetCustomerSessionsRequestDto } from '~/modules/customer/session/get-customer-sessions.request.dto';
import { GetCustomerSessionsResponseDto } from '~/modules/customer/session/get-customer-sessions.response.dto';
import { RevokeCustomerSessionRequestDto } from '~/modules/customer/session/revoke-customer-session.request.dto';
import { RevokeCustomerSessionResponseDto } from '~/modules/customer/session/revoke-customer-session.response.dto';
import { RevokeCustomerSessionsRequestDto } from '~/modules/customer/session/revoke-customer-sessions.request.dto';
import { RevokeCustomerSessionsResponseDto } from '~/modules/customer/session/revoke-customer-sessions.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/customers')
export class InternalCustomerSessionsController {
  constructor(private readonly tokenStore: TokenStore) {}

  @ApiOperation({ operationId: 'InternalCustomersController_listCustomerSessions_v1', summary: 'Machine: 고객 로그인 세션 조회' })
  @SwaggerApiResponse(GetCustomerSessionsResponseDto)
  @Get(':id/sessions')
  async listCustomerSessions(@Param('id') id: string): Promise<GetCustomerSessionsResponseDto> {
    const request = GetCustomerSessionsRequestDto.parse({ customerId: id }).validate();
    const records = await this.tokenStore.listUserTokens(request.customerId);
    return GetCustomerSessionsResponseDto.parse({ items: records.map((record) => ({ familyId: record.familyId, rememberMe: record.rememberMe, expiresAt: new Date(record.expiresAt) })) });
  }

  @ApiOperation({ operationId: 'InternalCustomersController_revokeCustomerSession_v1', summary: 'Machine: 고객 특정 세션 해제' })
  @SwaggerApiResponse(RevokeCustomerSessionResponseDto)
  @Delete(':id/sessions/:familyId')
  async revokeCustomerSession(@Param('id') id: string, @Param('familyId') familyId: string): Promise<RevokeCustomerSessionResponseDto> {
    const request = RevokeCustomerSessionRequestDto.parse({ customerId: id, familyId }).validate();
    const sessions = await this.tokenStore.listUserTokens(request.customerId);
    if (!sessions.some((session) => session.familyId === request.familyId)) {
      throw new ApplicationError({ code: 'CUSTOMER_SESSION_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    await this.tokenStore.revokeTokenFamily(request.familyId);
    return RevokeCustomerSessionResponseDto.ok();
  }

  @ApiOperation({ operationId: 'InternalCustomersController_revokeCustomerSessions_v1', summary: 'Machine: 고객 전체 세션 해제' })
  @SwaggerApiResponse(RevokeCustomerSessionsResponseDto)
  @Delete(':id/sessions')
  async revokeCustomerSessions(@Param('id') id: string): Promise<RevokeCustomerSessionsResponseDto> {
    const request = RevokeCustomerSessionsRequestDto.parse({ customerId: id }).validate();
    await this.tokenStore.revokeUserTokens(request.customerId);
    return RevokeCustomerSessionsResponseDto.ok();
  }
}
