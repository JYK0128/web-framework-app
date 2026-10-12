import { Controller, Get, Param, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { GetTermRevisionsQuery } from './get-term-revisions.query';
import { GetTermRevisionsRequestDto } from './get-term-revisions.request.dto';
import { GetTermRevisionsResponseDto } from './get-term-revisions.response.dto';

@ApiTags('terms')
@UserAuth()
@Controller('terms')
export class TermRevisionsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @Get('groups/:groupId/revisions')
  @ApiOperation({ summary: '게시된 약관 개정 이력 조회', operationId: 'TermsController_getRevisions_v1' })
  @SwaggerApiResponse(GetTermRevisionsResponseDto)
  getRevisions(@Param('groupId') groupId: string, @Query() dto: GetTermRevisionsRequestDto): Promise<GetTermRevisionsResponseDto> {
    return this.queryBus.execute(new GetTermRevisionsQuery({ groupId, dto }));
  }
}
