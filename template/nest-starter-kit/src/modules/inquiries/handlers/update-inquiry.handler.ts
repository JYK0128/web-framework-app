import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, valueIf } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateInquiryCommand } from '#/modules/inquiries/commands';
import { type UpdateInquiryRequestDto, UpdateInquiryResponseDto } from '#/modules/inquiries/dto';

@Injectable()
@CommandHandler(UpdateInquiryCommand)
export class UpdateInquiryHandler implements ICommandHandler<UpdateInquiryCommand, UpdateInquiryResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: UpdateInquiryCommand): Promise<UpdateInquiryResponseDto> {
    const inquiry = await this.identifyInquiry(command.input);
    this.verify(inquiry, command.input.input);
    return this.process(inquiry, command.input.input);
  }

  private verify(inquiry: Inquiry, input: UpdateInquiryRequestDto): void {
    if (!inquiry) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if ([input.category, input.title].some((value) => value !== undefined && !value.trim())) {
      throw new ApplicationError({ code: 'INQUIRY_CONTENT_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyInquiry(input: UpdateInquiryCommand['input']): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      input.isAdmin
        ? { id: input.inquiryId }
        : { id: input.inquiryId, user: this.sessionContext.requiredUser.id },
      { filters: valueIf(!input.isAdmin, false), populate: ['user'] },
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

    return UpdateInquiryResponseDto.fromPlain({
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
