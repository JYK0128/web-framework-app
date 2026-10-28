import { raw } from '@mikro-orm/core';
import { ApiSchema } from '@nestjs/swagger';
import { AggregateRequestDto, QueryRequestDto } from '@pkg/server-core/http/dto/request';

import { Event } from '~/core/database/entities/events';

const EventSummaryRequest = QueryRequestDto(Event, {
  search: { fields: ['title', 'content'] },
  filter: {
    startsAt: { type: 'date' },
    endsAt: { type: 'date' },
    publishedAt: { type: 'date' },
  },
});

@ApiSchema({ name: 'GetEventSummaryRequest' })
export class GetEventSummaryRequestDto extends EventSummaryRequest {}

const EventSummaryAggregation = AggregateRequestDto(Event, {
  fields: {
    startsAt: { field: 'startsAt', type: 'date' },
    endsAt: { field: 'endsAt', type: 'date' },
    publishedAt: { field: 'publishedAt', type: 'date' },
  },
  dimensions: {
    phase: {
      expression: (alias) => raw(`case when ??.?? <= current_timestamp then 'ended' when ??.?? > current_timestamp then 'upcoming' else 'ongoing' end`, [alias, 'endsAt', alias, 'startsAt']),
    },
  },
  defaultMetrics: [{ name: 'eventCount', function: 'count' }],
});

@ApiSchema({ name: 'GetEventSummaryAggregationRequest' })
export class GetEventSummaryAggregationRequestDto extends EventSummaryAggregation {}
