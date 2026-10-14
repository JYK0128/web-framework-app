import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';

import { AppEntityManager } from '#/core/database/entity-manager';
import { findSupportRoom } from '#/modules/support/rooms/support-rooms.helpers';
import { UpdateOwnSupportRoomCommand } from '#/modules/support/rooms/update-own-support-room.command';
import { UpdateSupportRoomResponseDto } from '#/modules/support/rooms/update-support-room.response.dto';

@CommandHandler(UpdateOwnSupportRoomCommand)
export class UpdateOwnSupportRoomHandler implements ICommandHandler<UpdateOwnSupportRoomCommand, UpdateSupportRoomResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly realtime: RealtimeService) {}
  async execute({ input }: UpdateOwnSupportRoomCommand): Promise<UpdateSupportRoomResponseDto> {
    const roomId = input.roomId;
    const room = await findSupportRoom(this.em, this.principal, roomId, true);
    if (input.dto.status !== undefined && room.status !== input.dto.status) {
      room.status = input.dto.status;
      await this.em.flush();
      await this.realtime.emitSocket({ namespace: '/support', room: room.id }, 'support.room.status.changed', { roomId: room.id });
    }
    return UpdateSupportRoomResponseDto.parseEntity(room);
  }
}
