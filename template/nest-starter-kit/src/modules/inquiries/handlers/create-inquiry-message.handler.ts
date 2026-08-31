import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/entities/auth/user.entity';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { EventBroker } from '#/infra/event-broker';
import { CreateInquiryMessageCommand } from '#/modules/inquiries/commands';
import { CreateInquiryMessageResponseDto } from '#/modules/inquiries/dto';
import { InquiryMessageCreatedEvent } from '#/modules/inquiries/events';

@Injectable()
@CommandHandler(CreateInquiryMessageCommand)
export class CreateInquiryMessageHandler implements ICommandHandler<CreateInquiryMessageCommand, CreateInquiryMessageResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly eventBroker: EventBroker,
  ) {}

  async execute(command: CreateInquiryMessageCommand): Promise<CreateInquiryMessageResponseDto> {
    const inquiry = await this.identifyInquiry(command.input);
    this.verifyNotClosed(inquiry);
    const author = await this.identifyAuthor(command.input.authorId);
    return this.process(command.input, inquiry, author);
  }

  private verifyNotClosed(inquiry: Inquiry): void {
    if (inquiry.status === InquiryStatus.CLOSED) {
      throw new ApplicationError({
        code: 'INQUIRY_ALREADY_CLOSED',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private async identifyInquiry(input: CreateInquiryMessageCommand['input']): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      input.isAdmin
        ? { id: input.inquiryId }
        : { id: input.inquiryId, user: input.authorId },
      { filters: input.isAdmin ? false : undefined, populate: ['user', 'assignee'] },
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

  private async process(input: CreateInquiryMessageCommand['input'], inquiry: Inquiry, author: User): Promise<CreateInquiryMessageResponseDto> {
    const content = input.input.content.trim();
    const message = this.em.create(InquiryMessage, {
      inquiry,
      author,
      authorRole: input.isAdmin ? InquiryMessageAuthorRole.ADMIN : InquiryMessageAuthorRole.USER,
      content,
    });
    this.em.persist(message);

    if (input.isAdmin) {
      inquiry.status = InquiryStatus.ANSWERED;
      if (!inquiry.assignee) {
        inquiry.assignee = author;
      }
    }
    this.em.persist(inquiry);

    await this.eventBroker.publish(new InquiryMessageCreatedEvent(inquiry, message));

    return new CreateInquiryMessageResponseDto(message);
  }
}
