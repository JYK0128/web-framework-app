import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { TOKEN_STORE, type TokenStore } from '#/infra/auth/user/jwt/token.store';
import { CustomerDetailResponseDto, CustomerListResponseDto, GetCustomersRequestDto } from '#/modules/customers/dto';
import { GetCustomerByIdQuery, GetCustomersQuery } from '#/modules/customers/queries';

import { BanCustomerCommand, CreateCustomerMembershipCommand, DeleteCustomerCommand, DeleteCustomerMembershipCommand, GetCustomerMembershipPermissionsQuery, GetCustomerMembershipsQuery, UnbanCustomerCommand, UpdateCustomerMembershipCommand, UpdateCustomerMemoCommand, UpdateCustomerRoleCommand } from './commands';
import { BanCustomerRequestDto, CreateCustomerMembershipRequestDto, CustomerActionResponseDto, CustomerMembershipItemDto, CustomerMembershipListResponseDto, CustomerMembershipPermissionListResponseDto, CustomerSessionListResponseDto, DeleteCustomerMembershipResponseDto, UpdateCustomerMembershipRequestDto, UpdateCustomerMemoRequestDto, UpdateCustomerRoleRequestDto } from './dto';

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
  @SwaggerApiResponse(CustomerListResponseDto)
  @Get()
  async listCustomers(@Query() query: GetCustomersRequestDto): Promise<CustomerListResponseDto> {
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
    return { items: records.map((record) => ({ familyId: record.familyId, rememberMe: record.rememberMe, expiresAt: new Date(record.expiresAt) })) };
  }

  @ApiOperation({ summary: 'Machine: 고객 특정 세션 해제' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Delete(':id/sessions/:familyId')
  async revokeCustomerSession(@Param('id') id: string, @Param('familyId') familyId: string): Promise<CustomerActionResponseDto> {
    const sessions = await this.tokenStore.listUserTokens(id);
    if (!sessions.some((session) => session.familyId === familyId)) {
      throw new ApplicationError({ code: 'CUSTOMER_SESSION_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '고객 세션을 찾을 수 없습니다.' });
    }
    await this.tokenStore.revokeTokenFamily(familyId);
    return CustomerActionResponseDto.fromPlain({ success: true });
  }

  @ApiOperation({ summary: 'Machine: 고객 전체 세션 해제' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Delete(':id/sessions')
  async revokeCustomerSessions(@Param('id') id: string): Promise<CustomerActionResponseDto> {
    await this.tokenStore.revokeUserTokens(id);
    return CustomerActionResponseDto.fromPlain({ success: true });
  }
}
