import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts';
import { RealtimeService } from '@pkg/server-core/realtime';

import { AppEntityManager } from '~/core/database/entity-manager';
import { findSupportRoom } from '~/modules/support/room/support-rooms.helpers';
import { UpdateSupportRoomCommand } from '~/modules/support/room/update-support-room.command';
import { UpdateSupportRoomResponseDto } from '~/modules/support/room/update-support-room.response.dto';

@CommandHandler(UpdateSupportRoomCommand)
export class UpdateSupportRoomHandler implements ICommandHandler<UpdateSupportRoomCommand, UpdateSupportRoomResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly realtime: RealtimeService) {}
  async execute({ input }: UpdateSupportRoomCommand): Promise<UpdateSupportRoomResponseDto> {
    const roomId = input.roomId;
    const room = await findSupportRoom(this.em, this.principal, roomId, false);
    if (input.dto.status !== undefined && room.status !== input.dto.status) {
      room.status = input.dto.status;
      await this.em.flush();
      await this.realtime.emitSocket({ namespace: '/support', room: room.id }, 'support.room.status.changed', { roomId: room.id });
    }
    return UpdateSupportRoomResponseDto.parseEntity(room);
  }
}
