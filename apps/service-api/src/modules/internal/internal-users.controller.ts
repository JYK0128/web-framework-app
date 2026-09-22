import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { CustomerDetailResponseDto, CustomerListResponseDto, GetCustomersRequestDto } from '../customers/dto';
import { GetCustomerByIdQuery, GetCustomersQuery } from '../customers/queries';

@ApiTags('Internal (Machine)')
@MachineAuth()
@Controller('internal/users')
export class InternalUsersController {
  constructor(private readonly queryBus: QueryBus) {}

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
}
