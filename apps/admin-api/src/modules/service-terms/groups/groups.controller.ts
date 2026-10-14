import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/internal-client';
import { CreateServiceTermGroupRequestDto } from '#/modules/service-terms/groups/create-service-term-group.request.dto';
import { CreateServiceTermGroupResponseDto } from '#/modules/service-terms/groups/create-service-term-group.response.dto';
import { DeleteServiceTermGroupRequestDto } from '#/modules/service-terms/groups/delete-service-term-group.request.dto';
import { DeleteServiceTermGroupResponseDto } from '#/modules/service-terms/groups/delete-service-term-group.response.dto';
import { GetServiceTermGroupsRequestDto } from '#/modules/service-terms/groups/get-service-term-groups.request.dto';
import { GetServiceTermGroupsResponseDto } from '#/modules/service-terms/groups/get-service-term-groups.response.dto';
import { UpdateServiceTermGroupRequestDto } from '#/modules/service-terms/groups/update-service-term-group.request.dto';
import { UpdateServiceTermGroupResponseDto } from '#/modules/service-terms/groups/update-service-term-group.response.dto';

@ApiTags('service-terms')
@UserAuth()
@Controller('service-terms')
export class ServiceTermGroupsController {
  constructor(private readonly internalClient: InternalClient) {}

  @Get('groups')
  @Permissions(AdminPermission.serviceTerm.read)
  @ApiOperation({ summary: '서비스 약관 그룹 목록 조회', operationId: 'ServiceTermsController_groups_v1' })
  @SwaggerApiResponse(GetServiceTermGroupsResponseDto)
  groups(@Query() _input: GetServiceTermGroupsRequestDto): Promise<GetServiceTermGroupsResponseDto> {
    return this.internalClient.fetch('/internal/service-terms/groups');
  }

  @Post('groups')
  @Permissions(AdminPermission.serviceTerm.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'ServiceTermsController_createGroup_v1' })
  @SwaggerApiResponse(CreateServiceTermGroupResponseDto, HttpStatus.CREATED)
  createGroup(@Body() input: CreateServiceTermGroupRequestDto): Promise<CreateServiceTermGroupResponseDto> {
    return this.internalClient.fetch('/internal/service-terms/groups', { method: 'POST', body: input });
  }

  @Patch('groups/:id')
  @Permissions(AdminPermission.serviceTerm.update)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'ServiceTermsController_updateGroup_v1' })
  @SwaggerApiResponse(UpdateServiceTermGroupResponseDto, HttpStatus.OK)
  updateGroup(@Param('id') id: string, @Body() input: UpdateServiceTermGroupRequestDto): Promise<UpdateServiceTermGroupResponseDto> {
    return this.internalClient.fetch(`/internal/service-terms/groups/${id}`, { method: 'PATCH', body: input });
  }

  @Delete('groups/:id')
  @Permissions(AdminPermission.serviceTerm.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'ServiceTermsController_deleteGroup_v1' })
  @SwaggerApiResponse(DeleteServiceTermGroupResponseDto, HttpStatus.OK)
  deleteGroup(@Param('id') id: string): Promise<DeleteServiceTermGroupResponseDto> {
    const input = DeleteServiceTermGroupRequestDto.parse({ groupId: id }).validate();
    return this.internalClient.fetch(`/internal/service-terms/groups/${input.groupId}`, { method: 'DELETE' });
  }
}
