import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Faq } from '#/entities/faqs/faq.entity';
import { UpdateFaqCommand } from '#/modules/faqs/commands/update-faq.command';
import { FaqItemDto, UpdateFaqRequestDto } from '#/modules/faqs/dto';

@Injectable()
@CommandHandler(UpdateFaqCommand)
export class UpdateFaqHandler implements ICommandHandler<UpdateFaqCommand, FaqItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateFaqCommand): Promise<FaqItemDto> {
    const faq = await this.identify(command.id);
    return this.process(faq, command.input);
  }

  private async identify(id: string): Promise<Faq> {
    const faq = await this.em.findOne(Faq, { id });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return faq;
  }

  private async process(faq: Faq, input: UpdateFaqRequestDto): Promise<FaqItemDto> {
    if (input.category !== undefined) faq.category = input.category.trim();
    if (input.question !== undefined) faq.question = input.question.trim();
    if (input.answer !== undefined) faq.answer = input.answer.trim();
    if (input.order !== undefined) faq.order = input.order;
    if (input.isPublished !== undefined) faq.isPublished = input.isPublished;

    return new FaqItemDto(faq);
  }
}
