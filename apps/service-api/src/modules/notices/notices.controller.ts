import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { GetPublicNoticesRequestDto, NoticeCursorResponseDto, NoticeItemDto } from './notices.dto';
import { GetNoticeQuery, GetPublicNoticesQuery } from './notices.messages';

@ApiTags('notices')
@Public()
@Controller('notices')
export class NoticesController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: '공개 공지사항 목록 조회' })
  @SwaggerApiResponse(NoticeCursorResponseDto)
  @Get()
  list(@Query() query: GetPublicNoticesRequestDto): Promise<NoticeCursorResponseDto> {
    return this.queryBus.execute(new GetPublicNoticesQuery(query));
  }

  @ApiOperation({ summary: '공개 공지사항 상세 조회' })
  @SwaggerApiResponse(NoticeItemDto)
  @Get(':id')
  detail(@Param('id') id: string): Promise<NoticeItemDto> {
    return this.queryBus.execute(new GetNoticeQuery(id, true));
  }
}
