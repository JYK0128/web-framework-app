import { HttpStatus } from '@nestjs/common';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { Faq, FaqCategory } from '~/core/database/entities/faqs';

export async function findFaq(em: AppEntityManager, faqId: string): Promise<Faq> {
  const faq = await em.findOne(Faq, { id: faqId }, { filters: false });
  if (!faq || faq.deletedAt) throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return faq;
}

export function normalize(input: Partial<{ category: FaqCategory, question: string, answer: string, sortOrder: number, isPublished: boolean }>, required = true) {
  return {
    ...(required || input.category !== undefined ? { category: input.category } : {}),
    ...(required || input.question !== undefined ? { question: input.question?.trim() } : {}),
    ...(required || input.answer !== undefined ? { answer: input.answer?.trim() } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
  };
}
