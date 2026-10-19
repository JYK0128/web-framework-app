import { HttpStatus } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';
import { ApplicationError } from '@pkg/shared/common';
import { isWithinOperatingHours } from '@pkg/shared/policy';

import { SupportMessage, SupportMessageSenderType, SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateOwnSupportMessageCommand } from '#/modules/support/message/create-own-support-message.command';
import { CreateSupportMessageResponseDto } from '#/modules/support/message/create-support-message.response.dto';
import { SupportMessageItemDto } from '#/modules/support/message/support-message-item.dto';
import { findSupportRoom } from '#/modules/support/room/support-rooms.helpers';
import { ServiceContext } from '#/modules/system-config/service.context';

@CommandHandler(CreateOwnSupportMessageCommand)
export class CreateOwnSupportMessageHandler implements ICommandHandler<CreateOwnSupportMessageCommand, CreateSupportMessageResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly serviceContext: ServiceContext, private readonly realtime: RealtimeService) {}
  async execute({ input }: CreateOwnSupportMessageCommand): Promise<CreateSupportMessageResponseDto> {
    const roomId = input.roomId;
    const room = await findSupportRoom(this.em, this.principal, roomId, true);
    this.ensureOpen(room);
    const user = this.principal.ensureUser();
    const config = await this.serviceContext.getConfig();
    const now = new Date();
    const message = await this.createMessage(room, input.dto.content, SupportMessageSenderType.USER, user.id);
    let autoReply: SupportMessageItemDto | undefined;
    if (!isWithinOperatingHours(config.operation, now)) {
      autoReply = await this.createMessage(room, config.inquiry.offlineReplyMessage, SupportMessageSenderType.SYSTEM);
    }
    await this.em.flush();
    await this.realtime.emitSocket({ namespace: '/support', room: room.id }, 'support.message.created', { roomId: room.id });
    if (autoReply) await this.realtime.emitSocket({ namespace: '/support', room: room.id }, 'support.message.created', { roomId: room.id });
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
