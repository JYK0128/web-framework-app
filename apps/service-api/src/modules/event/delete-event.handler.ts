import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '~/core/database/entity-manager';
import { DeleteEventCommand } from '~/modules/event/delete-event.command';
import { DeleteEventResponseDto } from '~/modules/event/delete-event.response.dto';
import { findEvent } from '~/modules/event/events.helpers';

@Injectable()
@CommandHandler(DeleteEventCommand)
export class DeleteEventHandler implements ICommandHandler<DeleteEventCommand, DeleteEventResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: DeleteEventCommand): Promise<DeleteEventResponseDto> {
    (await findEvent(this.em, input.eventId)).deletedAt = new Date();
    return { ok: true };
  }
}
