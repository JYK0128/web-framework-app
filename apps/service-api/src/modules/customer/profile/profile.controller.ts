import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth, SwaggerApiResponse } from '@pkg/server-core/http/decorators';

import { GetCustomerRequestDto } from '~/modules/customer/profile/get-customer.request.dto';
import { GetCustomerResponseDto } from '~/modules/customer/profile/get-customer.response.dto';
import { GetCustomerByIdQuery } from '~/modules/customer/profile/get-customer-by-id.query';
import { GetCustomersQuery } from '~/modules/customer/profile/get-customers.query';
import { GetCustomersRequestDto } from '~/modules/customer/profile/get-customers.request.dto';
import { GetCustomersResponseDto } from '~/modules/customer/profile/get-customers.response.dto';
import { UpdateCustomerMemoCommand } from '~/modules/customer/profile/update-customer-memo.command';
import { UpdateCustomerMemoRequestDto } from '~/modules/customer/profile/update-customer-memo.request.dto';
import { UpdateCustomerMemoResponseDto } from '~/modules/customer/profile/update-customer-memo.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/customers')
export class InternalCustomerProfileController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ operationId: 'InternalCustomersController_listCustomers_v1', summary: 'Machine: 대고객 회원 목록 조회 (Control Plane 전용)' })
  @SwaggerApiResponse(GetCustomersResponseDto)
  @Get()
  async listCustomers(@Query() query: GetCustomersRequestDto): Promise<GetCustomersResponseDto> {
    return this.queryBus.execute(new GetCustomersQuery(query));
  }

  @ApiOperation({ operationId: 'InternalCustomersController_getCustomer_v1', summary: 'Machine: 대고객 회원 상세 조회 (Control Plane 전용)' })
  @SwaggerApiResponse(GetCustomerResponseDto)
  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<GetCustomerResponseDto> {
    const request = GetCustomerRequestDto.parse({ customerId: id }).validate();
    return this.queryBus.execute(new GetCustomerByIdQuery(request));
  }

  @ApiOperation({ operationId: 'InternalCustomersController_updateCustomerMemo_v1', summary: 'Machine: 고객 내부 메모 변경' })
  @SwaggerApiResponse(UpdateCustomerMemoResponseDto)
  @Patch(':id/memo')
  async updateCustomerMemo(@Param('id') id: string, @Body() input: UpdateCustomerMemoRequestDto): Promise<UpdateCustomerMemoResponseDto> {
    return this.commandBus.execute(new UpdateCustomerMemoCommand({ customerId: id, dto: input }));
  }
}
