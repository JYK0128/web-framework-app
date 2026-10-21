import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { Notice } from '~/core/database/entities/notices';
import { AppEntityManager } from '~/core/database/entity-manager';

export async function findNotice(em: AppEntityManager, id: string): Promise<Notice> {
  const notice = await em.findOne(Notice, { id }, { filters: false });
  if (!notice || notice.deletedAt) throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return notice;
}
