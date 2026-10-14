import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { BanCustomerCommand } from '#/modules/customers/account/ban-customer.command';
import { BanCustomerRequestDto } from '#/modules/customers/account/ban-customer.request.dto';
import { BanCustomerResponseDto } from '#/modules/customers/account/ban-customer.response.dto';
import { DeleteCustomerCommand } from '#/modules/customers/account/delete-customer.command';
import { DeleteCustomerRequestDto } from '#/modules/customers/account/delete-customer.request.dto';
import { DeleteCustomerResponseDto } from '#/modules/customers/account/delete-customer.response.dto';
import { UnbanCustomerCommand } from '#/modules/customers/account/unban-customer.command';
import { UnbanCustomerRequestDto } from '#/modules/customers/account/unban-customer.request.dto';
import { UnbanCustomerResponseDto } from '#/modules/customers/account/unban-customer.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/customers')
export class InternalCustomerAccountController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ operationId: 'InternalCustomersController_banCustomer_v1', summary: 'Machine: 고객 이용 정지' })
  @SwaggerApiResponse(BanCustomerResponseDto)
  @Post(':id/ban')
  async banCustomer(@Param('id') id: string, @Body() input: BanCustomerRequestDto): Promise<BanCustomerResponseDto> {
    return this.commandBus.execute(new BanCustomerCommand({ customerId: id, dto: input }));
  }

  @ApiOperation({ operationId: 'InternalCustomersController_unbanCustomer_v1', summary: 'Machine: 고객 이용 정지 해제' })
  @SwaggerApiResponse(UnbanCustomerResponseDto)
  @Post(':id/unban')
  async unbanCustomer(@Param('id') id: string): Promise<UnbanCustomerResponseDto> {
    const request = UnbanCustomerRequestDto.parse({ customerId: id }).validate();
    return this.commandBus.execute(new UnbanCustomerCommand(request.customerId));
  }

  @ApiOperation({ operationId: 'InternalCustomersController_deleteCustomer_v1', summary: 'Machine: 고객 삭제' })
  @SwaggerApiResponse(DeleteCustomerResponseDto)
  @Delete(':id')
  async deleteCustomer(@Param('id') id: string): Promise<DeleteCustomerResponseDto> {
    const request = DeleteCustomerRequestDto.parse({ customerId: id }).validate();
    return this.commandBus.execute(new DeleteCustomerCommand(request.customerId));
  }
}
