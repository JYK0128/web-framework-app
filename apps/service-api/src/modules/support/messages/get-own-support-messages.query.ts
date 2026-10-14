import { Query } from '@nestjs/cqrs';

import { GetSupportMessagesResponseDto } from '#/modules/support/messages/get-support-messages.response.dto';

export class GetOwnSupportMessagesQuery extends Query<GetSupportMessagesResponseDto> {
  constructor(public readonly input: { roomId: string }) { super(); }
}
