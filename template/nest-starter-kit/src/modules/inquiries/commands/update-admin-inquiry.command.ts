import { Command } from '@nestjs/cqrs';

import type { UpdateAdminInquiryRequestDto, UpdateAdminInquiryResponseDto } from '#/modules/inquiries/dto';

export interface UpdateAdminInquiryPayload {
  inquiryId: string
  input: UpdateAdminInquiryRequestDto
}

export class UpdateAdminInquiryCommand extends Command<UpdateAdminInquiryResponseDto> {
  constructor(public readonly input: UpdateAdminInquiryPayload) {
    super();
  }
}
