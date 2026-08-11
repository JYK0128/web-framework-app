import type { Term } from '#/entities/terms/term.entity';

import type { TermDto } from './term.dto';

export function toTermDto(term: Term): TermDto {
  return {
    id: term.id,
    version: term.version,
    content: term.content,
    publishedAt: term.publishedAt ?? null,
    code: term.termGroup.code,
    title: term.termGroup.title,
    isRequired: term.termGroup.isRequired,
    sortOrder: term.termGroup.sortOrder,
  };
}
