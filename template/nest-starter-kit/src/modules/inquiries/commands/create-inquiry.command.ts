import { Command } from '@nestjs/cqrs';

import type { CreateInquiryRequestDto, CreateInquiryResponseDto } from '#/modules/inquiries/dto';

export interface CreateInquiryPayload {
  input: CreateInquiryRequestDto
  userId: string
}

export class CreateInquiryCommand extends Command<CreateInquiryResponseDto> {
  constructor(public readonly input: CreateInquiryPayload) {
    super();
  }
}
