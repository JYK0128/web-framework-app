import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteAdminInquiryCommand } from '#/modules/inquiries/commands';
import { DeleteAdminInquiryResponseDto } from '#/modules/inquiries/dto';

@Injectable()
@CommandHandler(DeleteAdminInquiryCommand)
export class DeleteAdminInquiryHandler implements ICommandHandler<DeleteAdminInquiryCommand, DeleteAdminInquiryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteAdminInquiryCommand): Promise<DeleteAdminInquiryResponseDto> {
    const inquiry = await this.identifyInquiry(command.input.inquiryId);
    this.verify(inquiry);
    this.em.remove(inquiry);
    return { ok: true };
  }

  private async identifyInquiry(id: string): Promise<Inquiry> {
    const inquiry = await this.em.findOne(Inquiry, { id }, { filters: false });
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private verify(inquiry: Inquiry): void {
    if (!inquiry) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }
}
