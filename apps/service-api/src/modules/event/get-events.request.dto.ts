import { PageRequestDto } from '@pkg/server-core/http/dto/request/page.request.dto';

import { Event } from '#/core/database/entities/events';

export class GetEventsRequestDto extends PageRequestDto<Event, 'startsAt' | 'createdAt'> {
  override get searchFields(): (keyof Event)[] { return ['title', 'content']; }
  override sort: ('startsAt' | 'createdAt')[] = ['startsAt'];
}
