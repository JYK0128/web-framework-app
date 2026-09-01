import { IEvent } from '@nestjs/cqrs';

import type { InquiryItemDto } from '#/modules/inquiries/dto';

export class InquiryCreatedEvent implements IEvent {
  constructor(
    public readonly inquiry: InquiryItemDto,
    public readonly author: { id: string, name?: string, email?: string },
  ) {}
}
