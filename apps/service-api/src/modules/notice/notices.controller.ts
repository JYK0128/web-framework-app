import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, SwaggerApiResponse } from '@pkg/server-core/http/decorators';

import { GetNoticeQuery } from '~/modules/notice/get-notice.query';
import { GetNoticeRequestDto } from '~/modules/notice/get-notice.request.dto';
import { GetNoticeResponseDto } from '~/modules/notice/get-notice.response.dto';
import { GetPublicNoticesQuery } from '~/modules/notice/get-public-notices.query';
import { GetPublicNoticesRequestDto } from '~/modules/notice/get-public-notices.request.dto';
import { GetPublicNoticesResponseDto } from '~/modules/notice/get-public-notices.response.dto';

@ApiTags('notices')
@Public()
@Controller('notices')
export class NoticesController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: '공개 공지사항 목록 조회' })
  @SwaggerApiResponse(GetPublicNoticesResponseDto)
  @Get()
  list(@Query() query: GetPublicNoticesRequestDto): Promise<GetPublicNoticesResponseDto> {
    return this.queryBus.execute(new GetPublicNoticesQuery(query));
  }

  @ApiOperation({ summary: '공개 공지사항 상세 조회' })
  @SwaggerApiResponse(GetNoticeResponseDto)
  @Get(':id')
  detail(@Param('id') id: string): Promise<GetNoticeResponseDto> {
    const request = GetNoticeRequestDto.parse({ noticeId: id }).validate();
    return this.queryBus.execute(new GetNoticeQuery(request, true));
  }
}
