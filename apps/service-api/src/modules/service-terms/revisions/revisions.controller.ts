import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { GetTermRevisionsQuery } from '#/modules/service-terms/revisions/get-term-revisions.query';
import { GetTermRevisionsRequestDto } from '#/modules/service-terms/revisions/get-term-revisions.request.dto';
import { GetTermRevisionsResponseDto } from '#/modules/service-terms/revisions/get-term-revisions.response.dto';

@ApiTags('service-terms')
@Controller('service-terms')
export class ServiceTermRevisionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Public()
  @Get('groups/:groupId/revisions')
  @ApiOperation({ operationId: 'ServiceTermsController_getRevisions_v1', summary: '게시된 약관 개정 이력 조회' })
  @SwaggerApiResponse(GetTermRevisionsResponseDto)
  getRevisions(@Param('groupId') groupId: string, @Query() dto: GetTermRevisionsRequestDto): Promise<GetTermRevisionsResponseDto> {
    return this.queryBus.execute(new GetTermRevisionsQuery({ groupId, dto }));
  }
}
