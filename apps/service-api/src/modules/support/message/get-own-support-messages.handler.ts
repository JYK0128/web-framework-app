import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts';

import { SupportMessage, SupportMessageSenderType } from '~/core/database/entities/support';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetOwnSupportMessagesQuery } from '~/modules/support/message/get-own-support-messages.query';
import { GetSupportMessagesResponseDto } from '~/modules/support/message/get-support-messages.response.dto';
import { SupportMessageItemDto } from '~/modules/support/message/support-message-item.dto';
import { findSupportRoom } from '~/modules/support/room/support-rooms.helpers';

@QueryHandler(GetOwnSupportMessagesQuery)
export class GetOwnSupportMessagesHandler implements IQueryHandler<GetOwnSupportMessagesQuery, GetSupportMessagesResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetOwnSupportMessagesQuery): Promise<GetSupportMessagesResponseDto> {
    const roomId = input.roomId;
    const room = await findSupportRoom(this.em, this.principal, roomId, true);
    const messages = await this.em.find(SupportMessage, { room: room.id }, { orderBy: { createdAt: 'ASC' }, populate: ['senderUser.profile'] });
    if (messages.length > 0) {
      for (const message of messages) {
        if (message.senderType !== SupportMessageSenderType.USER && !message.readAt) message.readAt = new Date();
      }
    }
    return GetSupportMessagesResponseDto.parse({ items: messages.map((message) => SupportMessageItemDto.parseEntity(message)) });
  }
}
