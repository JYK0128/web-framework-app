import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';

import { Event } from '~/core/database/entities/events';

const GetEventsRequestDtoBase = QueryRequestDtoFor<Event>()({
  search: { fields: ['title', 'content'] },
  sort: { fields: ['startsAt', 'createdAt'], default: ['startsAt'] },
  page: {},
});

export class GetEventsRequestDto extends GetEventsRequestDtoBase {
  override sort: ('startsAt' | 'createdAt')[] = ['startsAt'];
}
