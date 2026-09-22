import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { PrincipalContext } from '#/common/contexts/principal.context';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CustomerDetailResponseDto } from './dto';
import { GetCustomerByIdQuery } from './queries';

@ApiTags('customers')
@UserAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly queryBus: QueryBus, private readonly principalContext: PrincipalContext) {}

  @ApiOperation({ summary: '내 고객 프로필 조회' })
  @SwaggerApiResponse(CustomerDetailResponseDto)
  @Get('me')
  async getMe(): Promise<CustomerDetailResponseDto> {
    const user = this.principalContext.ensureUser();
    return this.queryBus.execute(new GetCustomerByIdQuery({ customerId: user.id }));
  }
}
