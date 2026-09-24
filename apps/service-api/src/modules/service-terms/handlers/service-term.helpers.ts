import type { Term } from '#/entities/terms/term.entity';
import type { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { ServiceTermItemDto } from '../dto';

export function toServiceTerm(term: Term): ServiceTermItemDto {
  return ServiceTermItemDto.fromPlain({
    id: term.id, groupId: term.termGroup.id, title: term.termGroup.title,
    version: term.version, content: term.content, isRequired: term.termGroup.isRequired,
    sortOrder: term.termGroup.sortOrder, publishedAt: term.publishedAt,
    createdAt: term.createdAt, updatedAt: term.updatedAt,
  });
}

export function isPublished(term: Term): boolean {
  return term.publishedAt !== null && term.publishedAt <= new Date();
}

export function latestPublishedTerms(terms: Term[]): Term[] {
  const latest = new Map<string, Term>();
  for (const term of terms.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))) {
    if (!latest.has(term.termGroup.id)) latest.set(term.termGroup.id, term);
  }
  return [...latest.values()].sort((a, b) => (a.termGroup.sortOrder ?? 0) - (b.termGroup.sortOrder ?? 0));
}

export function agreementFor(term: Term, agreement?: UserTermAgreement): boolean {
  return agreement?.term.id === term.id && agreement.isAgreed;
}
