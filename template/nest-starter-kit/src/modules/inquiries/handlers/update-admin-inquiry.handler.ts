import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateAdminInquiryCommand } from '#/modules/inquiries/commands';
import { UpdateAdminInquiryRequestDto, UpdateAdminInquiryResponseDto } from '#/modules/inquiries/dto';

@Injectable()
@CommandHandler(UpdateAdminInquiryCommand)
export class UpdateAdminInquiryHandler implements ICommandHandler<UpdateAdminInquiryCommand, UpdateAdminInquiryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateAdminInquiryCommand): Promise<UpdateAdminInquiryResponseDto> {
    const inquiry = await this.identifyInquiry(command.input.inquiryId);
    this.verify(inquiry, command.input.input);
    return this.process(inquiry, command.input.input);
  }

  private async identifyInquiry(id: string): Promise<Inquiry> {
    const inquiry = await this.em.findOne(Inquiry, { id }, { populate: ['user'] });
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private verify(inquiry: Inquiry, input: UpdateAdminInquiryRequestDto): void {
    if (!inquiry) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if ([input.category, input.title].some((value) => value !== undefined && !value.trim())) {
      throw new ApplicationError({ code: 'INQUIRY_CONTENT_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private process(inquiry: Inquiry, input: UpdateAdminInquiryRequestDto): UpdateAdminInquiryResponseDto {
    if (input.category !== undefined) inquiry.category = input.category.trim();
    if (input.title !== undefined) inquiry.title = input.title.trim();
    if (input.status !== undefined) inquiry.status = input.status;

    return UpdateAdminInquiryResponseDto.fromPlain({
      id: inquiry.id,
      category: inquiry.category,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
      userId: inquiry.user.id,
      userName: inquiry.user.name,
      assigneeId: inquiry.assignee?.id ?? null,
      assigneeName: inquiry.assignee?.name ?? inquiry.assignee?.email ?? null,
    });
  }
}
