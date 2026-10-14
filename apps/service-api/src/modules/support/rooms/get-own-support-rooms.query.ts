import { Query } from '@nestjs/cqrs';

import { GetSupportRoomsCursorRequestDto } from '#/modules/support/rooms/get-support-rooms-cursor.request.dto';
import { GetSupportRoomsCursorResponseDto } from '#/modules/support/rooms/get-support-rooms-cursor.response.dto';

export class GetOwnSupportRoomsQuery extends Query<GetSupportRoomsCursorResponseDto> {
  constructor(public readonly input: GetSupportRoomsCursorRequestDto) { super(); }
}
