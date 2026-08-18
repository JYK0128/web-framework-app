import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { UpdateInquiryCommand } from '#/modules/inquiries/commands';
import { InquiryItemDto, type UpdateInquiryRequestDto } from '#/modules/inquiries/dto';

@Injectable()
@CommandHandler(UpdateInquiryCommand)
export class UpdateInquiryHandler implements ICommandHandler<UpdateInquiryCommand, InquiryItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateInquiryCommand): Promise<InquiryItemDto> {
    const inquiry = await this.identifyInquiry(command);
    return this.process(inquiry, command.input);
  }

  private async identifyInquiry(command: UpdateInquiryCommand): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      command.isAdmin
        ? { id: command.inquiryId }
        : { id: command.inquiryId, user: command.userId },
      { filters: command.isAdmin ? false : undefined, populate: ['user'] },
    );
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private process(inquiry: Inquiry, input: UpdateInquiryRequestDto): InquiryItemDto {
    if (input.category !== undefined) inquiry.category = input.category.trim();
    if (input.title !== undefined) inquiry.title = input.title.trim();
    if (input.status !== undefined) inquiry.status = input.status;

    return new InquiryItemDto(inquiry);
  }
}
