import { Command } from '@nestjs/cqrs';

import type { InquiryItemDto, UpdateInquiryRequestDto } from '#/modules/inquiries/dto';

export class UpdateInquiryCommand extends Command<InquiryItemDto> {
  constructor(
    public readonly inquiryId: string,
    public readonly input: UpdateInquiryRequestDto,
    public readonly userId: string,
    public readonly isAdmin: boolean,
  ) {
    super();
  }
}
