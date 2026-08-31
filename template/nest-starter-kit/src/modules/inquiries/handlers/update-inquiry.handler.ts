import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateInquiryCommand } from '#/modules/inquiries/commands';
import { type UpdateInquiryRequestDto, UpdateInquiryResponseDto } from '#/modules/inquiries/dto';

@Injectable()
@CommandHandler(UpdateInquiryCommand)
export class UpdateInquiryHandler implements ICommandHandler<UpdateInquiryCommand, UpdateInquiryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateInquiryCommand): Promise<UpdateInquiryResponseDto> {
    const inquiry = await this.identifyInquiry(command.input);
    return this.process(inquiry, command.input.input);
  }

  private async identifyInquiry(input: UpdateInquiryCommand['input']): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      input.isAdmin
        ? { id: input.inquiryId }
        : { id: input.inquiryId, user: input.userId },
      { filters: input.isAdmin ? false : undefined, populate: ['user'] },
    );
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private process(inquiry: Inquiry, input: UpdateInquiryRequestDto): UpdateInquiryResponseDto {
    if (input.category !== undefined) inquiry.category = input.category.trim();
    if (input.title !== undefined) inquiry.title = input.title.trim();
    if (input.status !== undefined) inquiry.status = input.status;

    return new UpdateInquiryResponseDto(inquiry);
  }
}
