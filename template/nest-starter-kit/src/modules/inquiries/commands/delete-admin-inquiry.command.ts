import { Command } from '@nestjs/cqrs';

import type { DeleteAdminInquiryResponseDto } from '#/modules/inquiries/dto';

export interface DeleteAdminInquiryPayload {
  inquiryId: string
}

export class DeleteAdminInquiryCommand extends Command<DeleteAdminInquiryResponseDto> {
  constructor(public readonly input: DeleteAdminInquiryPayload) {
    super();
  }
}
