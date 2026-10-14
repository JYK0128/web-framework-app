import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';

import { AppEntityManager } from '#/core/database/entity-manager';
import { GetSupportRoomQuery } from '#/modules/support/rooms/get-support-room.query';
import { GetSupportRoomResponseDto } from '#/modules/support/rooms/get-support-room.response.dto';
import { findSupportRoom } from '#/modules/support/rooms/support-rooms.helpers';

@QueryHandler(GetSupportRoomQuery)
export class GetSupportRoomHandler implements IQueryHandler<GetSupportRoomQuery, GetSupportRoomResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetSupportRoomQuery): Promise<GetSupportRoomResponseDto> {
    const roomId = input.roomId;
    const mine = false;
    return GetSupportRoomResponseDto.parseEntity(await findSupportRoom(this.em, this.principal, roomId, mine));
  }
}
