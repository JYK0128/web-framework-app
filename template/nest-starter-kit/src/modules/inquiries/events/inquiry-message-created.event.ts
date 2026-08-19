import type { Inquiry } from '#/entities/inquiries/inquiry.entity';
import type { InquiryMessage } from '#/entities/inquiries/inquiry-message.entity';

export class InquiryMessageCreatedEvent {
  constructor(
    public readonly inquiry: Inquiry,
    public readonly message: InquiryMessage,
  ) {}
}
