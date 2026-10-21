import { HttpStatus } from '@nestjs/common';
import { PrincipalContext } from '@pkg/server-core/http/contexts';
import { ApplicationError } from '@pkg/shared/common';

import { Qna } from '~/core/database/entities/qna';
import { AppEntityManager } from '~/core/database/entity-manager';

export async function findQna(em: AppEntityManager, principal: PrincipalContext, qnaId: string, mine: boolean): Promise<Qna> {
  const user = mine ? principal.ensureUser() : null;
  const qna = await em.findOne(Qna, { id: qnaId, ...(user ? { user: user.id } : {}) }, { populate: ['user.profile', 'assignee.profile'] });
  if (!qna) throw new ApplicationError({ code: 'QNA_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return qna;
}
