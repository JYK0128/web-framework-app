import { Command } from '@nestjs/cqrs';

import type { CreateInquiryMessageRequestDto, CreateInquiryMessageResponseDto } from '#/modules/inquiries/dto';

export interface CreateInquiryMessagePayload {
  inquiryId: string
  input: CreateInquiryMessageRequestDto
  authorId: string
  isAdmin: boolean
}

export class CreateInquiryMessageCommand extends Command<CreateInquiryMessageResponseDto> {
  constructor(public readonly input: CreateInquiryMessagePayload) {
    super();
  }
}
