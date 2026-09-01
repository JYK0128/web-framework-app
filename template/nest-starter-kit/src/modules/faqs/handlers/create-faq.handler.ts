import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateFaqCommand } from '#/modules/faqs/commands/create-faq.command';
import { CreateFaqRequestDto, CreateFaqResponseDto } from '#/modules/faqs/dto';

@Injectable()
@CommandHandler(CreateFaqCommand)
export class CreateFaqHandler implements ICommandHandler<CreateFaqCommand, CreateFaqResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateFaqCommand): Promise<CreateFaqResponseDto> {
    return this.process(command.input);
  }

  private async process(input: CreateFaqRequestDto): Promise<CreateFaqResponseDto> {
    const faq = this.em.create(Faq, {
      category: input.category.trim(),
      question: input.question.trim(),
      answer: input.answer.trim(),
      order: input.order ?? 0,
      isPublished: input.isPublished ?? true,
    });

    this.em.persist(faq);
    return new CreateFaqResponseDto(faq);
  }
}
