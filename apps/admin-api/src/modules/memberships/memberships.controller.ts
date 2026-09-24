import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { CreateMembershipRequestDto, DeleteMembershipResponseDto, MembershipItemDto, MembershipListResponseDto, MembershipPermissionListResponseDto, UpdateMembershipRequestDto } from './dto';

@ApiTags('memberships')
@UserAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly internalClient: InternalServiceClient) {}

  @Get()
  @Permissions(Permission.customer.read)
  @SwaggerApiResponse(MembershipListResponseDto)
  @ApiOperation({ summary: '고객 멤버십 목록 조회' })
  list(): Promise<MembershipListResponseDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/customers/memberships'); }

  @Get('permissions')
  @Permissions(Permission.customer.read)
  @SwaggerApiResponse(MembershipPermissionListResponseDto)
  @ApiOperation({ summary: '고객 멤버십 권한 목록 조회' })
  listPermissions(): Promise<MembershipPermissionListResponseDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/customers/memberships/permissions'); }

  @Post()
  @Permissions(Permission.customer.update)
  @SwaggerApiResponse(MembershipItemDto)
  @ApiOperation({ summary: '고객 멤버십 생성' })
  create(@Body() input: CreateMembershipRequestDto): Promise<MembershipItemDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/customers/memberships', { method: 'POST', body: input }); }

  @Patch(':id')
  @Permissions(Permission.customer.update)
  @SwaggerApiResponse(MembershipItemDto)
  @ApiOperation({ summary: '고객 멤버십 수정' })
  update(@Param('id') id: string, @Body() input: UpdateMembershipRequestDto): Promise<MembershipItemDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/customers/memberships/${id}`, { method: 'PATCH', body: input }); }

  @Delete(':id')
  @Permissions(Permission.customer.delete)
  @SwaggerApiResponse(DeleteMembershipResponseDto)
  @ApiOperation({ summary: '고객 멤버십 삭제' })
  delete(@Param('id') id: string): Promise<DeleteMembershipResponseDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/customers/memberships/${id}`, { method: 'DELETE' }); }
}
