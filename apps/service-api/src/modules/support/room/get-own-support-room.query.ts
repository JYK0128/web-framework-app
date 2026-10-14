import { Query } from '@nestjs/cqrs';

import { GetSupportRoomResponseDto } from '#/modules/support/room/get-support-room.response.dto';

export class GetOwnSupportRoomQuery extends Query<GetSupportRoomResponseDto> {
  constructor(public readonly input: { roomId: string }) { super(); }
}
