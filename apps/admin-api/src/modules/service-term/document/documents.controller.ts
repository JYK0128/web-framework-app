import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '~/core/internal-client';
import { CreateServiceTermRequestDto } from '~/modules/service-term/document/create-service-term.request.dto';
import { CreateServiceTermResponseDto } from '~/modules/service-term/document/create-service-term.response.dto';
import { DeleteServiceTermRequestDto } from '~/modules/service-term/document/delete-service-term.request.dto';
import { DeleteServiceTermResponseDto } from '~/modules/service-term/document/delete-service-term.response.dto';
import { GetServiceTermsRequestDto } from '~/modules/service-term/document/get-service-terms.request.dto';
import { GetServiceTermsResponseDto } from '~/modules/service-term/document/get-service-terms.response.dto';
import { PublishServiceTermRequestDto } from '~/modules/service-term/document/publish-service-term.request.dto';
import { PublishServiceTermResponseDto } from '~/modules/service-term/document/publish-service-term.response.dto';
import { UpdateServiceTermRequestDto } from '~/modules/service-term/document/update-service-term.request.dto';
import { UpdateServiceTermResponseDto } from '~/modules/service-term/document/update-service-term.response.dto';

@ApiTags('service-terms')
@UserAuth()
@Controller('service-terms')
export class ServiceTermDocumentsController {
  constructor(private readonly internalClient: InternalClient) {}

  @Get()
  @Permissions(AdminPermission.serviceTerm.read)
  @ApiOperation({ summary: '서비스 약관 목록 조회', operationId: 'ServiceTermsController_list_v1' })
  @SwaggerApiResponse(GetServiceTermsResponseDto)
  list(@Query() query: GetServiceTermsRequestDto): Promise<GetServiceTermsResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set('search', query.search);
    if (query.groupId) params.set('groupId', query.groupId);
    query.sort.forEach((field) => params.append('sort[]', field));
    query.direction.forEach((direction) => params.append('direction[]', direction));
    return this.internalClient.fetch(`/internal/service-terms?${params.toString()}`);
  }

  @Post()
  @Permissions(AdminPermission.serviceTerm.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'ServiceTermsController_create_v1' })
  @SwaggerApiResponse(CreateServiceTermResponseDto, HttpStatus.CREATED)
  create(@Body() input: CreateServiceTermRequestDto): Promise<CreateServiceTermResponseDto> {
    return this.internalClient.fetch('/internal/service-terms', { method: 'POST', body: input });
  }

  @Patch(':id')
  @Permissions(AdminPermission.serviceTerm.update)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'ServiceTermsController_update_v1' })
  @SwaggerApiResponse(UpdateServiceTermResponseDto, HttpStatus.OK)
  update(@Param('id') id: string, @Body() input: UpdateServiceTermRequestDto): Promise<UpdateServiceTermResponseDto> {
    return this.internalClient.fetch(`/internal/service-terms/${id}`, { method: 'PATCH', body: input });
  }

  @Delete(':id')
  @Permissions(AdminPermission.serviceTerm.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'ServiceTermsController_delete_v1' })
  @SwaggerApiResponse(DeleteServiceTermResponseDto, HttpStatus.OK)
  delete(@Param('id') id: string): Promise<DeleteServiceTermResponseDto> {
    const input = DeleteServiceTermRequestDto.parse({ termId: id }).validate();
    return this.internalClient.fetch(`/internal/service-terms/${input.termId}`, { method: 'DELETE' });
  }

  @Post(':id/publish')
  @Permissions(AdminPermission.serviceTerm.publish)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'ServiceTermsController_publish_v1' })
  @SwaggerApiResponse(PublishServiceTermResponseDto, HttpStatus.OK)
  publish(@Param('id') id: string): Promise<PublishServiceTermResponseDto> {
    const input = PublishServiceTermRequestDto.parse({ termId: id }).validate();
    return this.internalClient.fetch(`/internal/service-terms/${input.termId}/publish`, { method: 'POST' });
  }
}
