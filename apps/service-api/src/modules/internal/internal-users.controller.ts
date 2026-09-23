import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { CustomerDetailResponseDto, CustomerListResponseDto, GetCustomersRequestDto } from '#/modules/customers/dto';
import { GetCustomerByIdQuery, GetCustomersQuery } from '#/modules/customers/queries';

import { BanCustomerCommand, DeleteCustomerCommand, UnbanCustomerCommand, UpdateCustomerRoleCommand } from './commands';
import { BanCustomerRequestDto, CustomerActionResponseDto, UpdateCustomerRoleRequestDto } from './dto';

@ApiTags('Internal (Machine)')
@MachineAuth()
@Controller('internal/users')
export class InternalUsersController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Machine: 대고객 회원 목록 조회 (Control Plane 전용)' })
  @SwaggerApiResponse(CustomerListResponseDto)
  @Get()
  async listUsers(@Query() query: GetCustomersRequestDto): Promise<CustomerListResponseDto> {
    return this.queryBus.execute(new GetCustomersQuery(query));
  }

  @ApiOperation({ summary: 'Machine: 대고객 회원 상세 조회 (Control Plane 전용)' })
  @SwaggerApiResponse(CustomerDetailResponseDto)
  @Get(':id')
  async getUser(@Param('id') id: string): Promise<CustomerDetailResponseDto> {
    return this.queryBus.execute(new GetCustomerByIdQuery({ customerId: id }));
  }

  @ApiOperation({ summary: 'Machine: 고객 이용 정지' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Post(':id/ban')
  async banUser(@Param('id') id: string, @Body() input: BanCustomerRequestDto): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new BanCustomerCommand({ customerId: id, dto: input }));
  }

  @ApiOperation({ summary: 'Machine: 고객 이용 정지 해제' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Post(':id/unban')
  async unbanUser(@Param('id') id: string): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new UnbanCustomerCommand(id));
  }

  @ApiOperation({ summary: 'Machine: 고객 삭제' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new DeleteCustomerCommand(id));
  }

  @ApiOperation({ summary: 'Machine: 고객 멤버십 변경' })
  @SwaggerApiResponse(CustomerActionResponseDto)
  @Patch(':id/role')
  async updateUserRole(@Param('id') id: string, @Body() input: UpdateCustomerRoleRequestDto): Promise<CustomerActionResponseDto> {
    return this.commandBus.execute(new UpdateCustomerRoleCommand({ customerId: id, dto: input }));
  }
}
