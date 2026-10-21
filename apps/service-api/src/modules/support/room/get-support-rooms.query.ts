import { Query } from '@nestjs/cqrs';

import { GetSupportRoomsRequestDto } from '~/modules/support/room/get-support-rooms.request.dto';
import { GetSupportRoomsResponseDto } from '~/modules/support/room/get-support-rooms.response.dto';

export class GetSupportRoomsQuery extends Query<GetSupportRoomsResponseDto> {
  constructor(public readonly input: GetSupportRoomsRequestDto) { super(); }
}
