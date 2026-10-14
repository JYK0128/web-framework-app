import { HttpStatus } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EventBroker } from '@pkg/server-core/event-broker/event-broker.service';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';
import { ApplicationError } from '@pkg/shared/common';
import { UserNotificationCreatedEvent } from '@pkg/shared/server';

import { SupportMessage, SupportMessageSenderType, SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateSupportMessageCommand } from '#/modules/support/message/create-support-message.command';
import { CreateSupportMessageResponseDto } from '#/modules/support/message/create-support-message.response.dto';
import { SupportMessageItemDto } from '#/modules/support/message/support-message-item.dto';
import { findSupportRoom } from '#/modules/support/room/support-rooms.helpers';

@CommandHandler(CreateSupportMessageCommand)
export class CreateSupportMessageHandler implements ICommandHandler<CreateSupportMessageCommand, CreateSupportMessageResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly eventBroker: EventBroker, private readonly realtime: RealtimeService) {}
  async execute({ input }: CreateSupportMessageCommand): Promise<CreateSupportMessageResponseDto> {
    const roomId = input.roomId;
    const room = await findSupportRoom(this.em, this.principal, roomId, false);
    this.ensureOpen(room);
    const message = await this.createMessage(room, input.dto.content, SupportMessageSenderType.AGENT);
    room.status = SupportRoomStatus.IN_PROGRESS;
    await this.em.flush();
    await this.realtime.emitSocket({ namespace: '/support', room: room.id }, 'support.message.created', { roomId: room.id });
    const user = room.user;
    const userId = typeof user === 'string' ? user : user.id;
    await this.eventBroker.publish(new UserNotificationCreatedEvent(userId, {
      id: message.id,
      kind: 'support.reply',
      roomId: room.id,
      message: message.content,
      createdAt: message.createdAt.toISOString(),
    }));
    return CreateSupportMessageResponseDto.parse(message);
  }

  private async createMessage(room: SupportRoom, content: string, senderType: SupportMessageSenderType, senderUser?: string): Promise<SupportMessageItemDto> {
    const message = this.em.create(SupportMessage, {
      room: room.id,
      senderUser: senderUser ?? null,
      senderType,
      content: content.trim(),
    });
    room.lastMessageAt = new Date();
    this.em.persist(message);
    return SupportMessageItemDto.parseEntity(message);
  }

  private ensureOpen(room: SupportRoom): void {
    if (room.status === SupportRoomStatus.CLOSED) throw new ApplicationError({ code: 'SUPPORT_ROOM_CLOSED', status: HttpStatus.CONFLICT });
  }
}
