import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateFaqCommand } from '#/modules/faqs/commands/create-faq.command';
import { CreateFaqRequestDto, CreateFaqResponseDto } from '#/modules/faqs/dto';

@Injectable()
@CommandHandler(CreateFaqCommand)
export class CreateFaqHandler implements ICommandHandler<CreateFaqCommand, CreateFaqResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateFaqCommand): Promise<CreateFaqResponseDto> {
    const input = this.identify(command);
    this.verify(input);
    return this.process(input);
  }

  private identify(command: CreateFaqCommand): CreateFaqRequestDto {
    return {
      ...command.input,
      category: command.input.category.trim(),
      question: command.input.question.trim(),
      answer: command.input.answer.trim(),
    };
  }

  private verify(input: CreateFaqRequestDto): void {
    if (!input.category || !input.question || !input.answer) {
      throw new ApplicationError({ code: 'FAQ_CONTENT_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(input: CreateFaqRequestDto): Promise<CreateFaqResponseDto> {
    const faq = this.em.create(Faq, {
      category: input.category,
      question: input.question,
      answer: input.answer,
      order: input.order ?? 0,
      isPublished: input.isPublished ?? true,
    });

    this.em.persist(faq);
    return CreateFaqResponseDto.fromPlain(faq);
  }
}
