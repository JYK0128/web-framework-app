import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';
import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';
import { AdminServiceTermGroupItemDto, AdminServiceTermGroupListResponseDto, AdminServiceTermGroupRequestDto, AdminServiceTermItemDto, AdminServiceTermListResponseDto, AdminServiceTermRequestDto, GetAdminServiceTermsRequestDto, ServiceTermActionResponseDto } from './dto';

@ApiTags('service-terms') @UserAuth() @Controller('service-terms')
export class ServiceTermsController {
  constructor(private readonly internalClient: InternalServiceClient) {}
  @Get('groups') @Permissions(Permission.serviceTerm.read) @ApiOperation({ summary: '서비스 약관 그룹 목록 조회' }) @SwaggerApiResponse(AdminServiceTermGroupListResponseDto)
  groups(): Promise<AdminServiceTermGroupListResponseDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/service-terms/groups'); }
  @Post('groups') @Permissions(Permission.serviceTerm.create) @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(AdminServiceTermGroupItemDto, HttpStatus.CREATED)
  createGroup(@Body() input: AdminServiceTermGroupRequestDto): Promise<AdminServiceTermGroupItemDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/service-terms/groups', { method: 'POST', body: input }); }
  @Patch('groups/:id') @Permissions(Permission.serviceTerm.update) @SwaggerApiResponse(AdminServiceTermGroupItemDto)
  updateGroup(@Param('id') id: string, @Body() input: AdminServiceTermGroupRequestDto): Promise<AdminServiceTermGroupItemDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/groups/${id}`, { method: 'PATCH', body: input }); }
  @Delete('groups/:id') @Permissions(Permission.serviceTerm.delete) @SwaggerApiResponse(ServiceTermActionResponseDto)
  deleteGroup(@Param('id') id: string): Promise<ServiceTermActionResponseDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/groups/${id}`, { method: 'DELETE' }); }
  @Get() @Permissions(Permission.serviceTerm.read) @ApiOperation({ summary: '서비스 약관 목록 조회' }) @SwaggerApiResponse(AdminServiceTermListResponseDto)
  list(@Query() query: GetAdminServiceTermsRequestDto): Promise<AdminServiceTermListResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) }); if (query.search) params.set('search', query.search); if (query.code) params.set('code', query.code);
    return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms?${params.toString()}`);
  }
  @Post() @Permissions(Permission.serviceTerm.create) @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(AdminServiceTermItemDto, HttpStatus.CREATED)
  create(@Body() input: AdminServiceTermRequestDto): Promise<AdminServiceTermItemDto> { return this.internalClient.fetchServiceApi('/api/v1/internal/service-terms', { method: 'POST', body: input }); }
  @Patch(':id') @Permissions(Permission.serviceTerm.update) @SwaggerApiResponse(AdminServiceTermItemDto)
  update(@Param('id') id: string, @Body() input: AdminServiceTermRequestDto): Promise<AdminServiceTermItemDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/${id}`, { method: 'PATCH', body: input }); }
  @Post(':id/publish') @Permissions(Permission.serviceTerm.publish) @SwaggerApiResponse(AdminServiceTermItemDto)
  publish(@Param('id') id: string): Promise<AdminServiceTermItemDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/${id}/publish`, { method: 'POST' }); }
  @Delete(':id') @Permissions(Permission.serviceTerm.delete) @SwaggerApiResponse(ServiceTermActionResponseDto)
  delete(@Param('id') id: string): Promise<ServiceTermActionResponseDto> { return this.internalClient.fetchServiceApi(`/api/v1/internal/service-terms/${id}`, { method: 'DELETE' }); }
}
