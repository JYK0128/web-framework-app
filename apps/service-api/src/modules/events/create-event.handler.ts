import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Event } from '#/core/database/entities/events';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateEventCommand } from '#/modules/events/create-event.command';
import { CreateEventResponseDto } from '#/modules/events/create-event.response.dto';
import { validateDates } from '#/modules/events/events.helpers';

@Injectable()
@CommandHandler(CreateEventCommand)
export class CreateEventHandler implements ICommandHandler<CreateEventCommand, CreateEventResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateEventCommand): Promise<CreateEventResponseDto> {
    validateDates(input.startsAt, input.endsAt);
    const event = this.em.create(Event, { ...input, title: input.title.trim(), content: input.content.trim(), imageUrl: input.imageUrl || null, linkUrl: input.linkUrl || null, publishedAt: input.publishedAt ?? null });
    this.em.persist(event);
    return CreateEventResponseDto.parseEntity(event);
  }
}
