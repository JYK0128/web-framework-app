import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts';

import { SupportMessage } from '~/core/database/entities/support';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetSupportMessagesQuery } from '~/modules/support/message/get-support-messages.query';
import { GetSupportMessagesResponseDto } from '~/modules/support/message/get-support-messages.response.dto';
import { SupportMessageItemDto } from '~/modules/support/message/support-message-item.dto';
import { findSupportRoom } from '~/modules/support/room/support-rooms.helpers';

@QueryHandler(GetSupportMessagesQuery)
export class GetSupportMessagesHandler implements IQueryHandler<GetSupportMessagesQuery, GetSupportMessagesResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetSupportMessagesQuery): Promise<GetSupportMessagesResponseDto> {
    const roomId = input.roomId;
    const room = await findSupportRoom(this.em, this.principal, roomId, false);
    const messages = await this.em.find(SupportMessage, { room: room.id }, { orderBy: { createdAt: 'ASC' }, populate: ['senderUser.profile'] });
    return GetSupportMessagesResponseDto.parse({ items: messages.map((message) => SupportMessageItemDto.parseEntity(message)) });
  }
}
