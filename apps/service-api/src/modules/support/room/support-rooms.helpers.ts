import { HttpStatus } from '@nestjs/common';
import { PrincipalContext } from '@pkg/server-core/http/contexts';
import { ApplicationError } from '@pkg/shared/common';

import { SupportRoom } from '~/core/database/entities/support';
import { AppEntityManager } from '~/core/database/entity-manager';

export async function findSupportRoom(em: AppEntityManager, principal: PrincipalContext, roomId: string, mine: boolean): Promise<SupportRoom> {
  const user = mine ? principal.ensureUser() : null;
  const room = await em.findOne(SupportRoom, { id: roomId, ...(user ? { user: user.id } : {}) }, { populate: ['user.profile', 'assignee.profile'] });
  if (!room) throw new ApplicationError({ code: 'SUPPORT_ROOM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return room;
}
