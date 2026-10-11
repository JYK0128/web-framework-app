import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/auth/machine/internal-client';
import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { GetServiceTermsRequestDto, ServiceTermActionResponseDto, ServiceTermGroupItemDto, ServiceTermGroupListResponseDto, ServiceTermGroupRequestDto, ServiceTermItemDto, ServiceTermPageResponseDto, ServiceTermRequestDto } from './dto';

@ApiTags('service-terms') @UserAuth() @Controller('service-terms')
export class ServiceTermsController {
  constructor(private readonly internalClient: InternalClient) {}
  @Get('groups') @Permissions(AdminPermission.serviceTerm.read) @ApiOperation({ summary: '서비스 약관 그룹 목록 조회' }) @SwaggerApiResponse(ServiceTermGroupListResponseDto)
  groups(): Promise<ServiceTermGroupListResponseDto> { return this.internalClient.fetch('/internal/service-terms/groups'); }

  @Post('groups') @Permissions(AdminPermission.serviceTerm.create) @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(ServiceTermGroupItemDto, HttpStatus.CREATED)
  createGroup(@Body() input: ServiceTermGroupRequestDto): Promise<ServiceTermGroupItemDto> { return this.internalClient.fetch('/internal/service-terms/groups', { method: 'POST', body: input }); }

  @Patch('groups/:id') @Permissions(AdminPermission.serviceTerm.update) @SwaggerApiResponse(ServiceTermGroupItemDto)
  updateGroup(@Param('id') id: string, @Body() input: ServiceTermGroupRequestDto): Promise<ServiceTermGroupItemDto> { return this.internalClient.fetch(`/internal/service-terms/groups/${id}`, { method: 'PATCH', body: input }); }

  @Delete('groups/:id') @Permissions(AdminPermission.serviceTerm.delete) @SwaggerApiResponse(ServiceTermActionResponseDto)
  deleteGroup(@Param('id') id: string): Promise<ServiceTermActionResponseDto> { return this.internalClient.fetch(`/internal/service-terms/groups/${id}`, { method: 'DELETE' }); }

  @Get() @Permissions(AdminPermission.serviceTerm.read) @ApiOperation({ summary: '서비스 약관 목록 조회' }) @SwaggerApiResponse(ServiceTermPageResponseDto)
  list(@Query() query: GetServiceTermsRequestDto): Promise<ServiceTermPageResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set('search', query.search);
    if (query.groupId) params.set('groupId', query.groupId);
    query.sort.forEach((field) => params.append('sort[]', field));
    query.direction.forEach((direction) => params.append('direction[]', direction));
    return this.internalClient.fetch(`/internal/service-terms?${params.toString()}`);
  }

  @Post() @Permissions(AdminPermission.serviceTerm.create) @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(ServiceTermItemDto, HttpStatus.CREATED)
  create(@Body() input: ServiceTermRequestDto): Promise<ServiceTermItemDto> { return this.internalClient.fetch('/internal/service-terms', { method: 'POST', body: input }); }

  @Patch(':id') @Permissions(AdminPermission.serviceTerm.update) @SwaggerApiResponse(ServiceTermItemDto)
  update(@Param('id') id: string, @Body() input: ServiceTermRequestDto): Promise<ServiceTermItemDto> { return this.internalClient.fetch(`/internal/service-terms/${id}`, { method: 'PATCH', body: input }); }

  @Post(':id/publish') @Permissions(AdminPermission.serviceTerm.publish) @SwaggerApiResponse(ServiceTermItemDto)
  publish(@Param('id') id: string): Promise<ServiceTermItemDto> { return this.internalClient.fetch(`/internal/service-terms/${id}/publish`, { method: 'POST' }); }

  @Delete(':id') @Permissions(AdminPermission.serviceTerm.delete) @SwaggerApiResponse(ServiceTermActionResponseDto)
  delete(@Param('id') id: string): Promise<ServiceTermActionResponseDto> { return this.internalClient.fetch(`/internal/service-terms/${id}`, { method: 'DELETE' }); }
}
