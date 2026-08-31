import { Command } from '@nestjs/cqrs';

import type { UpdateInquiryRequestDto, UpdateInquiryResponseDto } from '#/modules/inquiries/dto';

export interface UpdateInquiryPayload {
  inquiryId: string
  input: UpdateInquiryRequestDto
  userId: string
  isAdmin: boolean
}

export class UpdateInquiryCommand extends Command<UpdateInquiryResponseDto> {
  constructor(public readonly input: UpdateInquiryPayload) {
    super();
  }
}
