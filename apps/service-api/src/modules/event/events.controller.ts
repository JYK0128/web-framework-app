import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public, SwaggerApiResponse } from '@pkg/server-core/http/decorators';

import { GetEventQuery } from '~/modules/event/get-event.query';
import { GetEventRequestDto } from '~/modules/event/get-event.request.dto';
import { GetEventResponseDto } from '~/modules/event/get-event.response.dto';
import { GetEventSummaryQuery } from '~/modules/event/get-event-summary.query';
import { GetEventSummaryRequestDto } from '~/modules/event/get-event-summary.request.dto';
import { GetEventSummaryResponseDto } from '~/modules/event/get-event-summary.response.dto';
import { GetPublicEventsQuery } from '~/modules/event/get-public-events.query';
import { GetPublicEventsRequestDto } from '~/modules/event/get-public-events.request.dto';
import { GetPublicEventsResponseDto } from '~/modules/event/get-public-events.response.dto';

@ApiTags('events')
@Public()
@Controller('events')
export class EventsController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: '이벤트 단계별 집계 조회', operationId: 'EventsController_getEventSummary_v1' })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    description: '예: filters[startsAt][gte]=2026-01-01',
    schema: { type: 'object', additionalProperties: { type: 'object', additionalProperties: { type: 'string' } } },
  })
  @SwaggerApiResponse(GetEventSummaryResponseDto)
  @Get('summary')
  getSummary(@Query() query: GetEventSummaryRequestDto): Promise<GetEventSummaryResponseDto> {
    return this.queryBus.execute(new GetEventSummaryQuery(query));
  }

  @ApiOperation({ summary: '공개 이벤트 목록 조회' })
  @SwaggerApiResponse(GetPublicEventsResponseDto)
  @Get()
  list(@Query() query: GetPublicEventsRequestDto): Promise<GetPublicEventsResponseDto> { return this.queryBus.execute(new GetPublicEventsQuery(query)); }

  @ApiOperation({ summary: '공개 이벤트 상세 조회' })
  @SwaggerApiResponse(GetEventResponseDto)
  @Get(':id')
  detail(@Param('id') id: string): Promise<GetEventResponseDto> {
    const request = GetEventRequestDto.parse({ eventId: id }).validate();
    return this.queryBus.execute(new GetEventQuery(request, true));
  }
}
