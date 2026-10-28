import { HttpStatus } from '@nestjs/common';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { Event } from '~/core/database/entities/events';

export async function findEvent(em: AppEntityManager, id: string): Promise<Event> {
  const event = await em.findOne(Event, { id }, { filters: false });
  if (!event || event.deletedAt) throw new ApplicationError({ code: 'EVENT_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return event;
}

export function validateDates(startsAt: Date, endsAt: Date): void {
  if (startsAt >= endsAt) throw new ApplicationError({ code: 'EVENT_INVALID_PERIOD', status: HttpStatus.BAD_REQUEST, message: '이벤트 종료일은 시작일 이후여야 합니다.' });
}
