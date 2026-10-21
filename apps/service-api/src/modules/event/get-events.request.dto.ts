import { PageRequestDto } from '@pkg/server-core/http/dto/request';

import { Event } from '~/core/database/entities/events';

export class GetEventsRequestDto extends PageRequestDto<Event, 'startsAt' | 'createdAt'> {
  override get searchFields(): (keyof Event)[] { return ['title', 'content']; }
  override sort: ('startsAt' | 'createdAt')[] = ['startsAt'];
}
