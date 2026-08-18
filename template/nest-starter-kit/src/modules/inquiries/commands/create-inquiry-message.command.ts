import { Command } from '@nestjs/cqrs';

import type { CreateInquiryMessageRequestDto, InquiryMessageItemDto } from '#/modules/inquiries/dto';

export class CreateInquiryMessageCommand extends Command<InquiryMessageItemDto> {
  constructor(
    public readonly inquiryId: string,
    public readonly input: CreateInquiryMessageRequestDto,
    public readonly authorId: string,
    public readonly isAdmin: boolean,
  ) {
    super();
  }
}
