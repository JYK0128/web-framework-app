import { Command } from '@nestjs/cqrs';

import type { CreateAdminInquiryMessageRequestDto, CreateAdminInquiryMessageResponseDto } from '#/modules/inquiries/dto';

export interface CreateAdminInquiryMessagePayload {
  inquiryId: string
  input: CreateAdminInquiryMessageRequestDto
  authorId?: string
}

export class CreateAdminInquiryMessageCommand extends Command<CreateAdminInquiryMessageResponseDto> {
  constructor(public readonly input: CreateAdminInquiryMessagePayload) {
    super();
  }
}
