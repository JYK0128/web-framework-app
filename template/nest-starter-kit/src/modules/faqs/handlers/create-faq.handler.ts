import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Faq } from '#/entities/faqs/faq.entity';
import { CreateFaqCommand } from '#/modules/faqs/commands/create-faq.command';
import { CreateFaqRequestDto, FaqItemDto } from '#/modules/faqs/dto';

@Injectable()
@CommandHandler(CreateFaqCommand)
export class CreateFaqHandler implements ICommandHandler<CreateFaqCommand, FaqItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateFaqCommand): Promise<FaqItemDto> {
    return this.process(command.input);
  }

  private async process(input: CreateFaqRequestDto): Promise<FaqItemDto> {
    const faq = this.em.create(Faq, {
      category: input.category.trim(),
      question: input.question.trim(),
      answer: input.answer.trim(),
      order: input.order ?? 0,
      isPublished: input.isPublished ?? true,
    });

    this.em.persist(faq);
    return new FaqItemDto(faq);
  }
}
