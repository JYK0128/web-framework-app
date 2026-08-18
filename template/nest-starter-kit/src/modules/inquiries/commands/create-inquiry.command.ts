import { Command } from '@nestjs/cqrs';

import type { CreateInquiryRequestDto, InquiryItemDto } from '#/modules/inquiries/dto';

export class CreateInquiryCommand extends Command<InquiryItemDto> {
  constructor(
    public readonly input: CreateInquiryRequestDto,
    public readonly userId: string,
  ) {
    super();
  }
}
