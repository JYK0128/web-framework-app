import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { FaqItemDto } from '../dto';
import { CreateFaqCommand, DeleteFaqCommand, UpdateFaqCommand } from '../commands';

@Injectable()
@CommandHandler(CreateFaqCommand)
export class CreateFaqHandler implements ICommandHandler<CreateFaqCommand, FaqItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: CreateFaqCommand): Promise<FaqItemDto> {
    const faq = this.em.create(Faq, normalize(input, true) as { category: string, question: string, answer: string, sortOrder?: number, isPublished?: boolean });
    this.em.persist(faq);
    return FaqItemDto.fromPlain(faq);
  }
}

@Injectable()
@CommandHandler(UpdateFaqCommand)
export class UpdateFaqHandler implements ICommandHandler<UpdateFaqCommand, FaqItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: UpdateFaqCommand): Promise<FaqItemDto> {
    const faq = await findFaq(this.em, input.faqId);
    Object.assign(faq, normalize(input.dto, false));
    return FaqItemDto.fromPlain(faq);
  }
}

@Injectable()
@CommandHandler(DeleteFaqCommand)
export class DeleteFaqHandler implements ICommandHandler<DeleteFaqCommand, { success: boolean }> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ faqId }: DeleteFaqCommand): Promise<{ success: boolean }> {
    const faq = await findFaq(this.em, faqId);
    faq.deletedAt = new Date();
    return { success: true };
  }
}

async function findFaq(em: AppEntityManager, faqId: string): Promise<Faq> {
  const faq = await em.findOne(Faq, { id: faqId }, { filters: false });
  if (!faq || faq.deletedAt) throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: 'FAQ를 찾을 수 없습니다.' });
  return faq;
}

function normalize(input: Partial<{ category: string, question: string, answer: string, sortOrder: number, isPublished: boolean }>, required = true) {
  return {
    ...(required || input.category !== undefined ? { category: input.category?.trim() } : {}),
    ...(required || input.question !== undefined ? { question: input.question?.trim() } : {}),
    ...(required || input.answer !== undefined ? { answer: input.answer?.trim() } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
  };
}
