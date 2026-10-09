import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { GetNoticesRequestDto, NoticeItemDto, NoticePageResponseDto } from './notices.dto';
import { GetNoticeQuery, GetNoticesQuery } from './notices.messages';

@ApiTags('notices')
@Public()
@Controller('notices')
export class NoticesController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: '공개 공지사항 목록 조회' })
  @SwaggerApiResponse(NoticePageResponseDto)
  @Get()
  list(@Query() query: GetNoticesRequestDto): Promise<NoticePageResponseDto> {
    return this.queryBus.execute(new GetNoticesQuery(query, true));
  }

  @ApiOperation({ summary: '공개 공지사항 상세 조회' })
  @SwaggerApiResponse(NoticeItemDto)
  @Get(':id')
  detail(@Param('id') id: string): Promise<NoticeItemDto> {
    return this.queryBus.execute(new GetNoticeQuery(id, true));
  }
}
