import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { User } from '#/entities/auth/user.entity';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { EventBroker } from '#/infra/event-broker';
import { CreateAdminInquiryMessageCommand } from '#/modules/inquiries/commands';
import { CreateAdminInquiryMessageResponseDto } from '#/modules/inquiries/dto';
import { InquiryMessageCreatedEvent } from '#/modules/inquiries/events';

@Injectable()
@CommandHandler(CreateAdminInquiryMessageCommand)
export class CreateAdminInquiryMessageHandler implements ICommandHandler<CreateAdminInquiryMessageCommand, CreateAdminInquiryMessageResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly eventBroker: EventBroker,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: CreateAdminInquiryMessageCommand): Promise<CreateAdminInquiryMessageResponseDto> {
    const inquiry = await this.identifyInquiry(command.input.inquiryId);
    const author = await this.identifyAuthor(command.input.authorId ?? this.sessionContext.requiredUser.id);
    this.verify(inquiry);
    return this.process(command.input, inquiry, author);
  }

  private verify(inquiry: Inquiry): void {
    if (inquiry.status === InquiryStatus.CLOSED) {
      throw new ApplicationError({
        code: 'INQUIRY_ALREADY_CLOSED',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private async identifyInquiry(id: string): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      { id },
      { populate: ['user', 'assignee'] },
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

  private async process(
    input: CreateAdminInquiryMessageCommand['input'],
    inquiry: Inquiry,
    author: User,
  ): Promise<CreateAdminInquiryMessageResponseDto> {
    const message = this.em.create(InquiryMessage, {
      inquiry,
      author,
      authorRole: InquiryMessageAuthorRole.ADMIN,
      content: input.input.content.trim(),
    });
    this.em.persist(message);

    inquiry.status = InquiryStatus.ANSWERED;
    if (!inquiry.assignee) inquiry.assignee = author;
    this.em.persist(inquiry);

    await this.eventBroker.publish(new InquiryMessageCreatedEvent(inquiry, message));

    return CreateAdminInquiryMessageResponseDto.fromPlain({
      ...message,
      inquiryId: message.inquiry.id,
      authorId: message.author.id,
      authorName: message.author.name,
    });
  }
}
