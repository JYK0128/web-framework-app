import { Query } from '@nestjs/cqrs';

import { GetSupportRoomResponseDto } from '~/modules/support/room/get-support-room.response.dto';

export class GetUserSupportRoomQuery extends Query<GetSupportRoomResponseDto> {
  constructor(public readonly input: { roomId: string, userId: string }) { super(); }
}
