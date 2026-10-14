import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Faq, FaqCategory } from '#/core/database/entities/faqs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateFaqCommand } from '#/modules/faqs/create-faq.command';
import { CreateFaqResponseDto } from '#/modules/faqs/create-faq.response.dto';
import { normalize } from '#/modules/faqs/internal-faq-actions.helpers';

@Injectable()
@CommandHandler(CreateFaqCommand)
export class CreateFaqHandler implements ICommandHandler<CreateFaqCommand, CreateFaqResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: CreateFaqCommand): Promise<CreateFaqResponseDto> {
    const faq = this.em.create(Faq, normalize(input, true) as { category: FaqCategory, question: string, answer: string, sortOrder?: number, isPublished?: boolean });
    this.em.persist(faq);
    return CreateFaqResponseDto.parseEntity(faq);
  }
}
