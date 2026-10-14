import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/internal-client';
import { GetServiceTermRevisionsRequestDto } from '#/modules/service-term/revision/get-service-term-revisions.request.dto';
import { GetServiceTermRevisionsResponseDto } from '#/modules/service-term/revision/get-service-term-revisions.response.dto';

@ApiTags('service-terms')
@UserAuth()
@Controller('service-terms')
export class ServiceTermRevisionsController {
  constructor(private readonly internalClient: InternalClient) {}

  @Get('groups/:groupId/revisions')
  @Permissions(AdminPermission.serviceTerm.read)
  @ApiOperation({ summary: '서비스 약관 개정 이력 조회', operationId: 'ServiceTermsController_getRevisions_v1' })
  @SwaggerApiResponse(GetServiceTermRevisionsResponseDto)
  getRevisions(@Param('groupId') groupId: string, @Query() query: GetServiceTermRevisionsRequestDto): Promise<GetServiceTermRevisionsResponseDto> {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    return this.internalClient.fetch(`/internal/service-terms/groups/${encodeURIComponent(groupId)}/revisions?${params.toString()}`);
  }
}
