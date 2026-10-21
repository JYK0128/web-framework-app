import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth, SwaggerApiResponse } from '@pkg/server-core/http/decorators';

import { CreateCustomerMembershipCommand } from '~/modules/membership/create-customer-membership.command';
import { CreateCustomerMembershipRequestDto } from '~/modules/membership/create-customer-membership.request.dto';
import { CreateCustomerMembershipResponseDto } from '~/modules/membership/create-customer-membership.response.dto';
import { DeleteCustomerMembershipCommand } from '~/modules/membership/delete-customer-membership.command';
import { DeleteCustomerMembershipRequestDto } from '~/modules/membership/delete-customer-membership.request.dto';
import { DeleteCustomerMembershipResponseDto } from '~/modules/membership/delete-customer-membership.response.dto';
import { GetCustomerMembershipPermissionsQuery } from '~/modules/membership/get-customer-membership-permissions.query';
import { GetCustomerMembershipPermissionsRequestDto } from '~/modules/membership/get-customer-membership-permissions.request.dto';
import { GetCustomerMembershipPermissionsResponseDto } from '~/modules/membership/get-customer-membership-permissions.response.dto';
import { GetCustomerMembershipsQuery } from '~/modules/membership/get-customer-memberships.query';
import { GetCustomerMembershipsRequestDto } from '~/modules/membership/get-customer-memberships.request.dto';
import { GetCustomerMembershipsResponseDto } from '~/modules/membership/get-customer-memberships.response.dto';
import { UpdateCustomerMembershipCommand } from '~/modules/membership/update-customer-membership.command';
import { UpdateCustomerMembershipRequestDto } from '~/modules/membership/update-customer-membership.request.dto';
import { UpdateCustomerMembershipResponseDto } from '~/modules/membership/update-customer-membership.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/customers')
export class InternalMembershipsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ operationId: 'InternalCustomersController_listCustomerMemberships_v1', summary: 'Machine: 고객 멤버십 목록 조회' })
  @SwaggerApiResponse(GetCustomerMembershipsResponseDto)
  @Get('memberships')
  listCustomerMemberships(): Promise<GetCustomerMembershipsResponseDto> {
    return this.queryBus.execute(new GetCustomerMembershipsQuery(new GetCustomerMembershipsRequestDto()));
  }

  @ApiOperation({ operationId: 'InternalCustomersController_listCustomerMembershipPermissions_v1', summary: 'Machine: 고객 멤버십 권한 목록 조회' })
  @SwaggerApiResponse(GetCustomerMembershipPermissionsResponseDto)
  @Get('memberships/permissions')
  listCustomerMembershipPermissions(): Promise<GetCustomerMembershipPermissionsResponseDto> {
    return this.queryBus.execute(new GetCustomerMembershipPermissionsQuery(new GetCustomerMembershipPermissionsRequestDto()));
  }

  @ApiOperation({ operationId: 'InternalCustomersController_createCustomerMembership_v1', summary: 'Machine: 고객 멤버십 생성' })
  @SwaggerApiResponse(CreateCustomerMembershipResponseDto)
  @Post('memberships')
  createCustomerMembership(@Body() input: CreateCustomerMembershipRequestDto): Promise<CreateCustomerMembershipResponseDto> { return this.commandBus.execute(new CreateCustomerMembershipCommand(input)); }

  @ApiOperation({ operationId: 'InternalCustomersController_updateCustomerMembership_v1', summary: 'Machine: 고객 멤버십 수정' })
  @SwaggerApiResponse(UpdateCustomerMembershipResponseDto)
  @Patch('memberships/:id')
  updateCustomerMembership(@Param('id') id: string, @Body() input: UpdateCustomerMembershipRequestDto): Promise<UpdateCustomerMembershipResponseDto> { return this.commandBus.execute(new UpdateCustomerMembershipCommand({ membershipId: id, dto: input })); }

  @ApiOperation({ operationId: 'InternalCustomersController_deleteCustomerMembership_v1', summary: 'Machine: 고객 멤버십 삭제' })
  @SwaggerApiResponse(DeleteCustomerMembershipResponseDto)
  @Delete('memberships/:id')
  deleteCustomerMembership(@Param('id') id: string): Promise<DeleteCustomerMembershipResponseDto> {
    const request = DeleteCustomerMembershipRequestDto.parse({ membershipId: id }).validate();
    return this.commandBus.execute(new DeleteCustomerMembershipCommand(request.membershipId));
  }
}
