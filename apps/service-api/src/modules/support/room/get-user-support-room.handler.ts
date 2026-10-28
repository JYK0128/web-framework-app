import { HttpStatus } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { SupportRoom } from '~/core/database/entities/support';
import { GetSupportRoomResponseDto } from '~/modules/support/room/get-support-room.response.dto';
import { GetUserSupportRoomQuery } from '~/modules/support/room/get-user-support-room.query';

@QueryHandler(GetUserSupportRoomQuery)
export class GetUserSupportRoomHandler implements IQueryHandler<GetUserSupportRoomQuery, GetSupportRoomResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: GetUserSupportRoomQuery): Promise<GetSupportRoomResponseDto> {
    const room = await this.em.findOne(
      SupportRoom,
      { id: input.roomId, user: input.userId },
      { populate: ['user.profile', 'assignee.profile'] },
    );
    if (!room) throw new ApplicationError({ code: 'SUPPORT_ROOM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return GetSupportRoomResponseDto.parseEntity(room);
  }
}
