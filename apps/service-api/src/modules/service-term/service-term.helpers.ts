import type { Term, UserTermAgreement } from '~/core/database/entities/terms';

export function isPublished(term: Term): boolean {
  return term.publishedAt !== null && term.publishedAt <= new Date();
}

export function latestPublishedTerms(terms: Term[]): Term[] {
  const latest = new Map<string, Term>();
  const sortedTerms = terms.toSorted((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  for (const term of sortedTerms) {
    if (!latest.has(term.termGroup.id)) latest.set(term.termGroup.id, term);
  }
  return [...latest.values()].sort((a, b) => (a.termGroup.sortOrder ?? 0) - (b.termGroup.sortOrder ?? 0));
}

export function agreementFor(term: Term, agreement?: UserTermAgreement): boolean {
  return agreement?.term.id === term.id && agreement.isAgreed;
}
