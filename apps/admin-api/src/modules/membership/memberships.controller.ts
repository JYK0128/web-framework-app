import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/internal-client';
import { CreateMembershipRequestDto } from '#/modules/membership/create-membership.request.dto';
import { CreateMembershipResponseDto } from '#/modules/membership/create-membership.response.dto';
import { DeleteMembershipRequestDto } from '#/modules/membership/delete-membership.request.dto';
import { DeleteMembershipResponseDto } from '#/modules/membership/delete-membership.response.dto';
import { GetMembershipPermissionsRequestDto } from '#/modules/membership/get-membership-permissions.request.dto';
import { GetMembershipPermissionsResponseDto } from '#/modules/membership/get-membership-permissions.response.dto';
import { GetMembershipsRequestDto } from '#/modules/membership/get-memberships.request.dto';
import { GetMembershipsResponseDto } from '#/modules/membership/get-memberships.response.dto';
import { UpdateMembershipRequestDto } from '#/modules/membership/update-membership.request.dto';
import { UpdateMembershipResponseDto } from '#/modules/membership/update-membership.response.dto';

@ApiTags('memberships')
@UserAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly internalClient: InternalClient) {}

  @Get()
  @Permissions(AdminPermission.customer.read)
  @SwaggerApiResponse(GetMembershipsResponseDto)
  @ApiOperation({ summary: '고객 멤버십 목록 조회' })
  list(_input: GetMembershipsRequestDto = new GetMembershipsRequestDto()): Promise<GetMembershipsResponseDto> {
    return this.internalClient.fetch('/internal/customers/memberships');
  }

  @Get('permissions')
  @Permissions(AdminPermission.customer.read)
  @SwaggerApiResponse(GetMembershipPermissionsResponseDto)
  @ApiOperation({ summary: '고객 멤버십 권한 목록 조회' })
  listPermissions(_input: GetMembershipPermissionsRequestDto = new GetMembershipPermissionsRequestDto()): Promise<GetMembershipPermissionsResponseDto> {
    return this.internalClient.fetch('/internal/customers/memberships/permissions');
  }

  @Post()
  @Permissions(AdminPermission.customer.update)
  @SwaggerApiResponse(CreateMembershipResponseDto)
  @ApiOperation({ summary: '고객 멤버십 생성' })
  create(@Body() input: CreateMembershipRequestDto): Promise<CreateMembershipResponseDto> { return this.internalClient.fetch('/internal/customers/memberships', { method: 'POST', body: input }); }

  @Patch(':id')
  @Permissions(AdminPermission.customer.update)
  @SwaggerApiResponse(UpdateMembershipResponseDto)
  @ApiOperation({ summary: '고객 멤버십 수정' })
  update(@Param('id') id: string, @Body() input: UpdateMembershipRequestDto): Promise<UpdateMembershipResponseDto> { return this.internalClient.fetch(`/internal/customers/memberships/${id}`, { method: 'PATCH', body: input }); }

  @Delete(':id')
  @Permissions(AdminPermission.customer.delete)
  @SwaggerApiResponse(DeleteMembershipResponseDto)
  @ApiOperation({ summary: '고객 멤버십 삭제' })
  delete(@Param('id') id: string): Promise<DeleteMembershipResponseDto> {
    const request = DeleteMembershipRequestDto.parse({ membershipId: id }).validate();
    return this.internalClient.fetch(`/internal/customers/memberships/${request.membershipId}`, { method: 'DELETE' });
  }
}
