import { ApiSchema } from '@nestjs/swagger';
import { AggregateRequestDto } from '@pkg/server-core/http/dto/request';

import { Event } from '~/core/database/entities/events';

const EventSummaryRequest = AggregateRequestDto(Event, {
  dimensions: ['phaseOrder'],
  aggregates: {
    eventCount: { fn: 'count' },
  },
  searchFields: ['title', 'content'],
  filterFields: {
    startsAt: { type: 'date' },
    endsAt: { type: 'date' },
    publishedAt: { type: 'date' },
  },
});

@ApiSchema({ name: 'GetEventSummaryRequest' })
export class GetEventSummaryRequestDto extends EventSummaryRequest {}
