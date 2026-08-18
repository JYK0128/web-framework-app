import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { CreateInquiryCommand } from '#/modules/inquiries/commands';
import { InquiryItemDto } from '#/modules/inquiries/dto';

@Injectable()
@CommandHandler(CreateInquiryCommand)
export class CreateInquiryHandler implements ICommandHandler<CreateInquiryCommand, InquiryItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateInquiryCommand): Promise<InquiryItemDto> {
    const user = await this.identifyUser(command.userId);
    return this.process(command.input, user);
  }

  private async identifyUser(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private process(input: CreateInquiryCommand['input'], user: User): InquiryItemDto {
    const inquiry = this.em.create(Inquiry, {
      user,
      category: input.category.trim(),
      title: input.title.trim(),
      content: input.content.trim(),
    });
    const message = this.em.create(InquiryMessage, {
      inquiry,
      author: user,
      authorRole: InquiryMessageAuthorRole.USER,
      content: input.content.trim(),
    });
    this.em.persist(inquiry);
    this.em.persist(message);
    return new InquiryItemDto(inquiry);
  }
}
