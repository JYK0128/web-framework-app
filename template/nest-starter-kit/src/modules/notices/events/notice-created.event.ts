import type { Notice } from '#/entities/notices/notice.entity';

export class NoticeCreatedEvent {
  constructor(public readonly notice: Notice) {}
}
