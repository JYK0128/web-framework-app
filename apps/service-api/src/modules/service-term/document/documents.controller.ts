import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { GetServiceTermQuery } from '#/modules/service-term/document/get-service-term.query';
import { GetServiceTermRequestDto } from '#/modules/service-term/document/get-service-term.request.dto';
import { GetServiceTermResponseDto } from '#/modules/service-term/document/get-service-term.response.dto';
import { GetServiceTermsQuery } from '#/modules/service-term/document/get-service-terms.query';
import { GetServiceTermsRequestDto } from '#/modules/service-term/document/get-service-terms.request.dto';
import { GetServiceTermsResponseDto } from '#/modules/service-term/document/get-service-terms.response.dto';

@ApiTags('service-terms')
@Controller('service-terms')
export class ServiceTermDocumentsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Public() @ApiOperation({ operationId: 'ServiceTermsController_getTerms_v1', summary: '게시된 고객용 서비스 약관 목록 조회' }) @SwaggerApiResponse(GetServiceTermsResponseDto) @Get()
  getTerms(@Query() query: GetServiceTermsRequestDto): Promise<GetServiceTermsResponseDto> { return this.queryBus.execute(new GetServiceTermsQuery(query)); }

  @Public() @ApiOperation({ operationId: 'ServiceTermsController_getTerm_v1', summary: '게시된 고객용 서비스 약관 상세 조회' }) @SwaggerApiResponse(GetServiceTermResponseDto) @Get(':termId')
  getTerm(@Param('termId') termId: string): Promise<GetServiceTermResponseDto> {
    const request = GetServiceTermRequestDto.parse({ termId }).validate();
    return this.queryBus.execute(new GetServiceTermQuery(request));
  }
}
