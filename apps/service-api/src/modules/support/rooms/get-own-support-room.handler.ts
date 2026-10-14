import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';

import { AppEntityManager } from '#/core/database/entity-manager';
import { GetOwnSupportRoomQuery } from '#/modules/support/rooms/get-own-support-room.query';
import { GetSupportRoomResponseDto } from '#/modules/support/rooms/get-support-room.response.dto';
import { findSupportRoom } from '#/modules/support/rooms/support-rooms.helpers';

@QueryHandler(GetOwnSupportRoomQuery)
export class GetOwnSupportRoomHandler implements IQueryHandler<GetOwnSupportRoomQuery, GetSupportRoomResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetOwnSupportRoomQuery): Promise<GetSupportRoomResponseDto> {
    const roomId = input.roomId;
    const mine = true;
    return GetSupportRoomResponseDto.parseEntity(await findSupportRoom(this.em, this.principal, roomId, mine));
  }
}
