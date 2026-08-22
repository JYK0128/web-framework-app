import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteInquiryCommand } from '#/modules/inquiries/commands';
import { DeleteInquiryResponseDto } from '#/modules/inquiries/dto';

@Injectable()
@CommandHandler(DeleteInquiryCommand)
export class DeleteInquiryHandler implements ICommandHandler<DeleteInquiryCommand, DeleteInquiryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteInquiryCommand): Promise<DeleteInquiryResponseDto> {
    const inquiry = await this.identifyInquiry(command.input);
    this.process(inquiry);
    return { ok: true };
  }

  private async identifyInquiry(input: DeleteInquiryCommand['input']): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      input.isAdmin
        ? { id: input.inquiryId }
        : { id: input.inquiryId, user: input.userId },
      { filters: input.isAdmin ? false : undefined },
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
