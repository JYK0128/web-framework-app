import { Command } from '@nestjs/cqrs';

import type { DeleteInquiryResponseDto } from '#/modules/inquiries/dto';

export interface DeleteInquiryPayload {
  inquiryId: string
  userId: string
  isAdmin: boolean
}

export class DeleteInquiryCommand extends Command<DeleteInquiryResponseDto> {
  constructor(public readonly input: DeleteInquiryPayload) {
    super();
  }
}
