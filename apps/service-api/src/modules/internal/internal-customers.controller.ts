import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';

import { TOKEN_STORE, type TokenStore } from '#/core/auth/user/token/stores/token.store';
import { MachineAuth } from '#/core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { CustomerDetailResponseDto, CustomerPageResponseDto, GetCustomersRequestDto } from '#/modules/customers';
import { GetCustomerByIdQuery } from '#/modules/customers/get-customer-by-id.query';
import { GetCustomersQuery } from '#/modules/customers/get-customers.query';

import { BanCustomerRequestDto, CreateCustomerMembershipRequestDto, CustomerActionResponseDto, CustomerMembershipItemDto, CustomerMembershipListResponseDto, CustomerMembershipPermissionListResponseDto, CustomerSessionListResponseDto, DeleteCustomerMembershipResponseDto, UpdateCustomerMembershipRequestDto, UpdateCustomerMemoRequestDto, UpdateCustomerRoleRequestDto } from '.';
import { BanCustomerCommand, DeleteCustomerCommand, UnbanCustomerCommand, UpdateCustomerMemoCommand, UpdateCustomerRoleCommand } from './customers/customer-actions.command';
import { CreateCustomerMembershipCommand, DeleteCustomerMembershipCommand, GetCustomerMembershipPermissionsQuery, GetCustomerMembershipsQuery, UpdateCustomerMembershipCommand } from './memberships/customer-membership.commands';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/customers')
export class InternalCustomersController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus, @Inject(TOKEN_STORE) private readonly tokenStore: TokenStore) {}

  @ApiOperation({ summary: 'Machine: 고객 멤버십 목록 조회' })
  @SwaggerApiResponse(CustomerMembershipListResponseDto)
  @Get('memberships')
  listCustomerMemberships(): Promise<CustomerMembershipListResponseDto> { return this.queryBus.execute(new GetCustomerMembershipsQuery()); }

  @ApiOperation({ summary: 'Machine: 고객 멤버십 권한 목록 조회' })
  @SwaggerApiResponse(CustomerMembershipPermissionListResponseDto)
  @Get('memberships/permissions')
  listCustomerMembershipPermissions(): Promise<CustomerMembershipPermissionListResponseDto> { return this.queryBus.execute(new GetCustomerMembershipPermissionsQuery()); }

  @ApiOperation({ summary: 'Machine: 고객 멤버십 생성' })
  @SwaggerApiResponse(CustomerMembershipItemDto)
  @Post('memberships')
  createCustomerMembership(@Body() input: CreateCustomerMembershipRequestDto): Promise<CustomerMembershipItemDto> { return this.commandBus.execute(new CreateCustomerMembershipCommand(input)); }

  @ApiOperation({ summary: 'Machine: 고객 멤버십 수정' })
  @SwaggerApiResponse(CustomerMembershipItemDto)
  @Patch('memberships/:id')
  updateCustomerMembership(@Param('id') id: string, @Body() input: UpdateCustomerMembershipRequestDto): Promise<CustomerMembershipItemDto> { return this.commandBus.execute(new UpdateCustomerMembershipCommand({ membershipId: id, dto: input })); }

  @ApiOperation({ summary: 'Machine: 고객 멤버십 삭제' })
  @SwaggerApiResponse(DeleteCustomerMembershipResponseDto)
  @Delete('memberships/:id')
  deleteCustomerMembership(@Param('id') id: string): Promise<DeleteCustomerMembershipResponseDto> { return this.commandBus.execute(new DeleteCustomerMembershipCommand(id)); }

  @ApiOperation({ summary: 'Machine: 대고객 회원 목록 조회 (Control Plane 전용)' })
  @SwaggerApiResponse(CustomerPageResponseDto)
  @Get()
  async listCustomers(@Query() query: GetCustomersRequestDto): Promise<CustomerPageResponseDto> {
    return this.queryBus.execute(new GetCustomersQuery(query));
  }

  @ApiOperation({ summary: 'Machine: 대고객 회원 상세 조회 (Control Plane 전용)' })
  @SwaggerApiResponse(CustomerDetailResponseDto)
  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<CustomerDetailResponseDto> {
    return this.queryBus.execute(new GetCustomerByIdQuery({ customerId: id }));
  }

  @ApiOperation({ summary: 'Machine: 고객 이용 정지' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Post(':id/ban')
  async banCustomer(@Param('id') id: string, @Body() input: BanCustomerRequestDto): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new BanCustomerCommand({ customerId: id, dto: input }));
  }

  @ApiOperation({ summary: 'Machine: 고객 이용 정지 해제' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Post(':id/unban')
  async unbanCustomer(@Param('id') id: string): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new UnbanCustomerCommand(id));
  }

  @ApiOperation({ summary: 'Machine: 고객 삭제' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Delete(':id')
  async deleteCustomer(@Param('id') id: string): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new DeleteCustomerCommand(id));
  }

  @ApiOperation({ summary: 'Machine: 고객 멤버십 변경' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Patch(':id/role')
  async updateCustomerRole(@Param('id') id: string, @Body() input: UpdateCustomerRoleRequestDto): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new UpdateCustomerRoleCommand({ customerId: id, dto: input }));
  }

  @ApiOperation({ summary: 'Machine: 고객 내부 메모 변경' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Patch(':id/memo')
  async updateCustomerMemo(@Param('id') id: string, @Body() input: UpdateCustomerMemoRequestDto): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new UpdateCustomerMemoCommand({ customerId: id, dto: input }));
  }

  @ApiOperation({ summary: 'Machine: 고객 로그인 세션 조회' })
  @SwaggerApiResponse(CustomerSessionListResponseDto)
  @Get(':id/sessions')
  async listCustomerSessions(@Param('id') id: string): Promise<CustomerSessionListResponseDto> {
    const records = await this.tokenStore.listUserTokens(id);
    return CustomerSessionListResponseDto.parse({ items: records.map((record) => ({ familyId: record.familyId, rememberMe: record.rememberMe, expiresAt: new Date(record.expiresAt) })) });
  }

  @ApiOperation({ summary: 'Machine: 고객 특정 세션 해제' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Delete(':id/sessions/:familyId')
  async revokeCustomerSession(@Param('id') id: string, @Param('familyId') familyId: string): Promise<CustomerActionResponseDto> {
    const sessions = await this.tokenStore.listUserTokens(id);
    if (!sessions.some((session) => session.familyId === familyId)) {
      throw new ApplicationError({ code: 'CUSTOMER_SESSION_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    await this.tokenStore.revokeTokenFamily(familyId);
    return CustomerActionResponseDto.parse({ ok: true });
  }

  @ApiOperation({ summary: 'Machine: 고객 전체 세션 해제' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Delete(':id/sessions')
  async revokeCustomerSessions(@Param('id') id: string): Promise<CustomerActionResponseDto> {
    await this.tokenStore.revokeUserTokens(id);
    return CustomerActionResponseDto.parse({ ok: true });
  }
}
