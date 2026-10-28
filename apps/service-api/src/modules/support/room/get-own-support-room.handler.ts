import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { PrincipalContext } from '@pkg/server-core/http/contexts';

import { GetOwnSupportRoomQuery } from '~/modules/support/room/get-own-support-room.query';
import { GetSupportRoomResponseDto } from '~/modules/support/room/get-support-room.response.dto';
import { findSupportRoom } from '~/modules/support/room/support-rooms.helpers';

@QueryHandler(GetOwnSupportRoomQuery)
export class GetOwnSupportRoomHandler implements IQueryHandler<GetOwnSupportRoomQuery, GetSupportRoomResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetOwnSupportRoomQuery): Promise<GetSupportRoomResponseDto> {
    const roomId = input.roomId;
    const mine = true;
    return GetSupportRoomResponseDto.parseEntity(await findSupportRoom(this.em, this.principal, roomId, mine));
  }
}
