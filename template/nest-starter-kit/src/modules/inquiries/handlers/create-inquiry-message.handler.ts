import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { CreateInquiryMessageCommand } from '#/modules/inquiries/commands';
import { InquiryMessageItemDto } from '#/modules/inquiries/dto';

@Injectable()
@CommandHandler(CreateInquiryMessageCommand)
export class CreateInquiryMessageHandler implements ICommandHandler<CreateInquiryMessageCommand, InquiryMessageItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateInquiryMessageCommand): Promise<InquiryMessageItemDto> {
    const inquiry = await this.identifyInquiry(command);
    this.verifyNotClosed(inquiry);
    const author = await this.identifyAuthor(command.authorId);
    return this.process(command, inquiry, author);
  }

  private verifyNotClosed(inquiry: Inquiry): void {
    if (inquiry.status === InquiryStatus.CLOSED) {
      throw new ApplicationError({
        code: 'INQUIRY_ALREADY_CLOSED',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private async identifyInquiry(command: CreateInquiryMessageCommand): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      command.isAdmin
        ? { id: command.inquiryId }
        : { id: command.inquiryId, user: command.authorId },
      { filters: command.isAdmin ? false : undefined, populate: ['user', 'assignee'] },
    );
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private async identifyAuthor(id: string): Promise<User> {
    const author = await this.em.findOne(User, { id });
    if (!author) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return author;
  }

  private process(command: CreateInquiryMessageCommand, inquiry: Inquiry, author: User): InquiryMessageItemDto {
    const content = command.input.content.trim();
    const message = this.em.create(InquiryMessage, {
      inquiry,
      author,
      authorRole: command.isAdmin ? InquiryMessageAuthorRole.ADMIN : InquiryMessageAuthorRole.USER,
      content,
    });
    this.em.persist(message);

    if (command.isAdmin) {
      inquiry.status = InquiryStatus.ANSWERED;
      if (!inquiry.assignee) {
        inquiry.assignee = author;
      }
    }
    this.em.persist(inquiry);

    return new InquiryMessageItemDto(message);
  }
}
