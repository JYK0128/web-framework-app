import { IEvent } from '@nestjs/cqrs';

import type { NoticeItemDto } from '#/modules/notices/dto';

export class NoticeCreatedEvent implements IEvent {
  constructor(public readonly notice: NoticeItemDto) {}
}
