import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { FaqCursorResponseDto, FaqDetailResponseDto, GetPublicFaqsRequestDto } from './dto';
import { GetFaqQuery, GetFaqsQuery } from './queries';

@ApiTags('faqs')
@Public()
@Controller('faqs')
export class FaqsController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: '공개 FAQ 목록 조회' })
  @SwaggerApiResponse(FaqCursorResponseDto)
  @Get()
  getFaqs(@Query() query: GetPublicFaqsRequestDto): Promise<FaqCursorResponseDto> {
    return this.queryBus.execute(new GetFaqsQuery(query));
  }

  @ApiOperation({ summary: '공개 FAQ 상세 조회' })
  @SwaggerApiResponse(FaqDetailResponseDto)
  @Get(':faqId')
  getFaq(@Param('faqId') faqId: string): Promise<FaqDetailResponseDto> {
    return this.queryBus.execute(new GetFaqQuery({ faqId }));
  }
}
