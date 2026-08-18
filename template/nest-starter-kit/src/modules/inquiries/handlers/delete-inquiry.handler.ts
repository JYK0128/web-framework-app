import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { DeleteInquiryCommand } from '#/modules/inquiries/commands';

@Injectable()
@CommandHandler(DeleteInquiryCommand)
export class DeleteInquiryHandler implements ICommandHandler<DeleteInquiryCommand, void> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteInquiryCommand): Promise<void> {
    const inquiry = await this.identifyInquiry(command);
    this.process(inquiry);
  }

  private async identifyInquiry(command: DeleteInquiryCommand): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      command.isAdmin
        ? { id: command.inquiryId }
        : { id: command.inquiryId, user: command.userId },
      { filters: command.isAdmin ? false : undefined },
    );
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private process(inquiry: Inquiry): void {
    this.em.remove(inquiry);
  }
}
