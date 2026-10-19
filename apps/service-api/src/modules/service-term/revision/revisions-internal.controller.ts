import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { GetTermRevisionsQuery } from '#/modules/service-term/revision/get-term-revisions.query';
import { GetTermRevisionsRequestDto } from '#/modules/service-term/revision/get-term-revisions.request.dto';
import { GetTermRevisionsResponseDto } from '#/modules/service-term/revision/get-term-revisions.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/service-terms')
export class InternalServiceTermRevisionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('groups/:groupId/revisions')
  @ApiOperation({ operationId: 'InternalServiceTermsController_getRevisions_v1', summary: 'Machine: 서비스 약관 개정 이력 조회' })
  @SwaggerApiResponse(GetTermRevisionsResponseDto)
  getRevisions(@Param('groupId') groupId: string, @Query() dto: GetTermRevisionsRequestDto): Promise<GetTermRevisionsResponseDto> {
    return this.queryBus.execute(new GetTermRevisionsQuery({ groupId, dto }));
  }
}
