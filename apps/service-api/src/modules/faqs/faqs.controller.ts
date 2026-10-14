import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { GetFaqQuery } from '#/modules/faqs/get-faq.query';
import { GetFaqRequestDto } from '#/modules/faqs/get-faq.request.dto';
import { GetFaqResponseDto } from '#/modules/faqs/get-faq.response.dto';
import { GetFaqsQuery } from '#/modules/faqs/get-faqs.query';
import { GetPublicFaqsRequestDto } from '#/modules/faqs/get-public-faqs.request.dto';
import { GetPublicFaqsResponseDto } from '#/modules/faqs/get-public-faqs.response.dto';

@ApiTags('faqs')
@Public()
@Controller('faqs')
export class FaqsController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: '공개 FAQ 목록 조회' })
  @SwaggerApiResponse(GetPublicFaqsResponseDto)
  @Get()
  getFaqs(@Query() query: GetPublicFaqsRequestDto): Promise<GetPublicFaqsResponseDto> {
    return this.queryBus.execute(new GetFaqsQuery(query));
  }

  @ApiOperation({ summary: '공개 FAQ 상세 조회' })
  @SwaggerApiResponse(GetFaqResponseDto)
  @Get(':faqId')
  getFaq(@Param('faqId') faqId: string): Promise<GetFaqResponseDto> {
    const request = GetFaqRequestDto.parse({ faqId }).validate();
    return this.queryBus.execute(new GetFaqQuery(request));
  }
}
