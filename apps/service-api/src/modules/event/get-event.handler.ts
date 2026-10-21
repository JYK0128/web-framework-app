import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Event } from '~/core/database/entities/events';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetEventQuery } from '~/modules/event/get-event.query';
import { GetEventResponseDto } from '~/modules/event/get-event.response.dto';

@Injectable()
@QueryHandler(GetEventQuery)
export class GetEventHandler implements IQueryHandler<GetEventQuery, GetEventResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input, publicOnly }: GetEventQuery): Promise<GetEventResponseDto> {
    const event = await this.em.findOne(Event, { id: input.eventId, ...(publicOnly ? { publishedAt: { $ne: null, $lte: new Date() } } : {}) });
    if (!event) throw new ApplicationError({ code: 'EVENT_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return GetEventResponseDto.parseEntity(event);
  }
}
