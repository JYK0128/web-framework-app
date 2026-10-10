import { type FilterQuery } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Event } from '#/entities/events/event.entity';
import { PublicationStatus } from '#/entities/notices/notice.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { EventActionResponseDto, EventCursorResponseDto, EventItemDto, EventPageResponseDto, EventPhase } from './events.dto';
import { CreateEventCommand, DeleteEventCommand, GetEventQuery, GetEventsQuery, GetPublicEventsQuery, UpdateEventCommand } from './events.messages';

@Injectable()
@QueryHandler(GetEventsQuery)
export class GetEventsHandler implements IQueryHandler<GetEventsQuery, EventPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetEventsQuery): Promise<EventPageResponseDto> {
    const result = await this.em.findByPage<Event>(Event, input.toFilterQuery(), input.toPageOptions());
    return EventPageResponseDto.fromPlain({ ...result, items: result.items.map((item) => EventItemDto.from(item)) });
  }
}

@Injectable()
@QueryHandler(GetEventQuery)
export class GetEventHandler implements IQueryHandler<GetEventQuery, EventItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ id, publicOnly }: GetEventQuery): Promise<EventItemDto> {
    const event = await this.em.findOne(Event, { id, ...(publicOnly ? { status: PublicationStatus.published } : {}) });
    if (!event) throw new ApplicationError({ code: 'EVENT_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return EventItemDto.from(event);
  }
}

@Injectable()
@CommandHandler(CreateEventCommand)
export class CreateEventHandler implements ICommandHandler<CreateEventCommand, EventItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateEventCommand): Promise<EventItemDto> {
    validateDates(input.startsAt, input.endsAt);
    const event = this.em.create(Event, { ...input, title: input.title.trim(), content: input.content.trim(), imageUrl: input.imageUrl || null, linkUrl: input.linkUrl || null, publishedAt: input.status === PublicationStatus.published ? new Date() : null });
    this.em.persist(event);
    return EventItemDto.from(event);
  }
}

@Injectable()
@CommandHandler(UpdateEventCommand)
export class UpdateEventHandler implements ICommandHandler<UpdateEventCommand, EventItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ id, input }: UpdateEventCommand): Promise<EventItemDto> {
    const event = await findEvent(this.em, id);
    validateDates(input.startsAt ?? event.startsAt, input.endsAt ?? event.endsAt);
    const wasPublished = event.status === PublicationStatus.published;
    Object.assign(event, input, input.title === undefined ? {} : { title: input.title.trim() }, input.content === undefined ? {} : { content: input.content.trim() }, input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl || null }, input.linkUrl === undefined ? {} : { linkUrl: input.linkUrl || null });
    if (input.status === PublicationStatus.published && !wasPublished) event.publishedAt = new Date();
    if (input.status === PublicationStatus.draft) event.publishedAt = null;
    return EventItemDto.from(event);
  }
}

@Injectable()
@CommandHandler(DeleteEventCommand)
export class DeleteEventHandler implements ICommandHandler<DeleteEventCommand, EventActionResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ id }: DeleteEventCommand): Promise<EventActionResponseDto> {
    (await findEvent(this.em, id)).deletedAt = new Date();
    return { ok: true };
  }
}

async function findEvent(em: AppEntityManager, id: string): Promise<Event> {
  const event = await em.findOne(Event, { id }, { filters: false });
  if (!event || event.deletedAt) throw new ApplicationError({ code: 'EVENT_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return event;
}

function validateDates(startsAt: Date, endsAt: Date): void {
  if (startsAt >= endsAt) throw new ApplicationError({ code: 'EVENT_INVALID_PERIOD', status: HttpStatus.BAD_REQUEST, message: '이벤트 종료일은 시작일 이후여야 합니다.' });
}

@Injectable()
@QueryHandler(GetPublicEventsQuery)
export class GetPublicEventsHandler implements IQueryHandler<GetPublicEventsQuery, EventCursorResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetPublicEventsQuery): Promise<EventCursorResponseDto> {
    const filters: FilterQuery<Event>[] = [input.toFilterQuery(), { status: PublicationStatus.published }];
    const now = new Date();
    if (input.phase === EventPhase.ongoing) filters.push({ startsAt: { $lte: now }, endsAt: { $gt: now } });
    if (input.phase === EventPhase.upcoming) filters.push({ startsAt: { $gt: now } });
    if (input.phase === EventPhase.ended) filters.push({ endsAt: { $lte: now } });
    const result = await this.em.findByCursor(Event, {
      ...input.toCursorOptions(),
      where: { $and: filters },
      orderBy: { phaseOrder: 'ASC', timelineOrder: 'ASC', id: 'ASC' },
    });
    return EventCursorResponseDto.fromPlain({ ...result, startCursor: result.startCursor, endCursor: result.endCursor, items: result.items.map((item) => EventItemDto.from(item)) });
  }
}
