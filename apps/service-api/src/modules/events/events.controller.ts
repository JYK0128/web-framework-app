import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { EventCursorResponseDto, EventItemDto, GetPublicEventsRequestDto } from './events.dto';
import { GetEventQuery, GetPublicEventsQuery } from './events.messages';

@ApiTags('events')
@Public()
@Controller('events')
export class EventsController {
  constructor(private readonly queryBus: QueryBus) {}
  @ApiOperation({ summary: '공개 이벤트 목록 조회' })
  @SwaggerApiResponse(EventCursorResponseDto)
  @Get()
  list(@Query() query: GetPublicEventsRequestDto): Promise<EventCursorResponseDto> { return this.queryBus.execute(new GetPublicEventsQuery(query)); }

  @ApiOperation({ summary: '공개 이벤트 상세 조회' })
  @SwaggerApiResponse(EventItemDto)
  @Get(':id')
  detail(@Param('id') id: string): Promise<EventItemDto> { return this.queryBus.execute(new GetEventQuery(id, true)); }
}
