import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { GetServiceTermsRequestDto, ServiceTermActionResponseDto, ServiceTermGroupItemDto, ServiceTermGroupListResponseDto, ServiceTermGroupRequestDto, ServiceTermItemDto, ServiceTermListResponseDto, ServiceTermRequestDto } from './dto';

@ApiTags('service-terms') @UserAuth() @Controller('service-terms')
export class ServiceTermsController {
  constructor(private readonly internalClient: InternalServiceClient) {}
  @Get('groups') @Permissions(Permission.serviceTerm.read) @ApiOperation({ summary: '서비스 약관 그룹 목록 조회' }) @SwaggerApiResponse(ServiceTermGroupListResponseDto)
  groups(): Promise<ServiceTermGroupListResponseDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/service-terms/groups'); }

  @Post('groups') @Permissions(Permission.serviceTerm.create) @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(ServiceTermGroupItemDto, HttpStatus.CREATED)
  createGroup(@Body() input: ServiceTermGroupRequestDto): Promise<ServiceTermGroupItemDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/service-terms/groups', { method: 'POST', body: input }); }

  @Patch('groups/:id') @Permissions(Permission.serviceTerm.update) @SwaggerApiResponse(ServiceTermGroupItemDto)
  updateGroup(@Param('id') id: string, @Body() input: ServiceTermGroupRequestDto): Promise<ServiceTermGroupItemDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/groups/${id}`, { method: 'PATCH', body: input }); }

  @Delete('groups/:id') @Permissions(Permission.serviceTerm.delete) @SwaggerApiResponse(ServiceTermActionResponseDto)
  deleteGroup(@Param('id') id: string): Promise<ServiceTermActionResponseDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/groups/${id}`, { method: 'DELETE' }); }

  @Get() @Permissions(Permission.serviceTerm.read) @ApiOperation({ summary: '서비스 약관 목록 조회' }) @SwaggerApiResponse(ServiceTermListResponseDto)
  list(@Query() query: GetServiceTermsRequestDto): Promise<ServiceTermListResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set('search', query.search);
    if (query.groupId) params.set('groupId', query.groupId);
    query.sort.forEach((field) => params.append('sort[]', field));
    query.direction.forEach((direction) => params.append('direction[]', direction));
    return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms?${params.toString()}`);
  }

  @Post() @Permissions(Permission.serviceTerm.create) @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(ServiceTermItemDto, HttpStatus.CREATED)
  create(@Body() input: ServiceTermRequestDto): Promise<ServiceTermItemDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/service-terms', { method: 'POST', body: input }); }

  @Patch(':id') @Permissions(Permission.serviceTerm.update) @SwaggerApiResponse(ServiceTermItemDto)
  update(@Param('id') id: string, @Body() input: ServiceTermRequestDto): Promise<ServiceTermItemDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/${id}`, { method: 'PATCH', body: input }); }

  @Post(':id/publish') @Permissions(Permission.serviceTerm.publish) @SwaggerApiResponse(ServiceTermItemDto)
  publish(@Param('id') id: string): Promise<ServiceTermItemDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/${id}/publish`, { method: 'POST' }); }

  @Delete(':id') @Permissions(Permission.serviceTerm.delete) @SwaggerApiResponse(ServiceTermActionResponseDto)
  delete(@Param('id') id: string): Promise<ServiceTermActionResponseDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/${id}`, { method: 'DELETE' }); }
}
