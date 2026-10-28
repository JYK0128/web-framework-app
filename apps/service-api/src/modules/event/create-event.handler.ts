import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Event } from '~/core/database/entities/events';
import { CreateEventCommand } from '~/modules/event/create-event.command';
import { CreateEventResponseDto } from '~/modules/event/create-event.response.dto';
import { validateDates } from '~/modules/event/events.helpers';

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
