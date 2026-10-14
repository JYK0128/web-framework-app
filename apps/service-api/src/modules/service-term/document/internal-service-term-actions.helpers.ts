import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { Term, TermGroup } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';

export async function findServiceTerm(em: AppEntityManager, termId: string): Promise<Term> {
  const term = await em.findOne(Term, { id: termId }, { populate: ['termGroup'], filters: false });
  if (!term || term.deletedAt) {
    throw new ApplicationError({ code: 'SERVICE_TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  }
  return term;
}

export function assertEditable(term: Term): void {
  if (term.isPublished) {
    throw new ApplicationError({ code: 'SERVICE_TERM_ALREADY_PUBLISHED', status: HttpStatus.CONFLICT });
  }
}

export async function assertVersionAvailable(em: AppEntityManager, group: TermGroup, version: string, excludedTermId?: string): Promise<void> {
  const duplicate = await em.findOne(Term, {
    termGroup: group,
    version: version.trim(),
    ...(excludedTermId ? { id: { $ne: excludedTermId } } : {}),
  }, { filters: false });
  if (duplicate) {
    throw new ApplicationError({ code: 'SERVICE_TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
  }
}

export function parseFuturePublishDate(value?: string | null): Date | null {
  const publishedAt = value ? new Date(value) : null;
  if (publishedAt && publishedAt <= new Date()) {
    throw new ApplicationError({ code: 'SERVICE_TERM_PUBLISH_DATE_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
  }
  return publishedAt;
}

export async function flushServiceTerm(em: AppEntityManager): Promise<void> {
  try {
    await em.flush();
  }
  catch (error) {
    if (error instanceof UniqueConstraintViolationException && error.message.includes('service_term_group_version_unique')) {
      throw ApplicationError.from(error, { code: 'SERVICE_TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
    throw error;
  }
}
