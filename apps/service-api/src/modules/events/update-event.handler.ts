import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/core/database/entity-manager';
import { findEvent, validateDates } from '#/modules/events/events.helpers';
import { UpdateEventCommand } from '#/modules/events/update-event.command';
import { UpdateEventResponseDto } from '#/modules/events/update-event.response.dto';

@Injectable()
@CommandHandler(UpdateEventCommand)
export class UpdateEventHandler implements ICommandHandler<UpdateEventCommand, UpdateEventResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ eventId, input }: UpdateEventCommand): Promise<UpdateEventResponseDto> {
    const event = await findEvent(this.em, eventId);
    validateDates(input.startsAt ?? event.startsAt, input.endsAt ?? event.endsAt);
    Object.assign(event, input, input.title === undefined ? {} : { title: input.title.trim() }, input.content === undefined ? {} : { content: input.content.trim() }, input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl || null }, input.linkUrl === undefined ? {} : { linkUrl: input.linkUrl || null });
    return UpdateEventResponseDto.parseEntity(event);
  }
}
