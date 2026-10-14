import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { isWithinOperatingHours } from '@pkg/shared/policy';

import { SupportMessage, SupportMessageSenderType, SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateSupportRoomCommand } from '#/modules/support/room/create-support-room.command';
import { CreateSupportRoomResponseDto } from '#/modules/support/room/create-support-room.response.dto';
import { SupportRoomCreatedEvent } from '#/modules/support/room/support-room-created.event';
import { ServiceContext } from '#/modules/system-config/service.context';

@CommandHandler(CreateSupportRoomCommand)
export class CreateSupportRoomHandler implements ICommandHandler<CreateSupportRoomCommand, CreateSupportRoomResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly eventBus: EventBus, private readonly serviceContext: ServiceContext) {}
  async execute({ input }: CreateSupportRoomCommand): Promise<CreateSupportRoomResponseDto> {
    const user = this.principal.ensureUser();
    const content = input.content.trim();
    const now = new Date();
    const config = await this.serviceContext.getConfig();
    const { customerGreeting } = config.inquiry;
    const room = this.em.create(SupportRoom, {
      title: content.slice(0, 40),
      user: user.id,
      status: SupportRoomStatus.OPEN,
      lastMessageAt: now,
    });
    const greeting = this.em.create(SupportMessage, {
      room,
      senderType: SupportMessageSenderType.SYSTEM,
      content: customerGreeting,
      createdAt: new Date(now.getTime() - 1),
    });
    const message = this.em.create(SupportMessage, {
      room,
      senderUser: user.id,
      senderType: SupportMessageSenderType.USER,
      content,
      createdAt: now,
    });
    const messages = [room, greeting, message];
    if (!isWithinOperatingHours(config.operation, now)) {
      const autoReplyAt = new Date(now.getTime() + 1);
      room.lastMessageAt = autoReplyAt;
      messages.push(this.em.create(SupportMessage, {
        room,
        senderType: SupportMessageSenderType.SYSTEM,
        content: config.inquiry.offlineReplyMessage,
        createdAt: autoReplyAt,
      }));
    }
    this.em.persist(messages);
    await this.em.flush();
    this.eventBus.publish(new SupportRoomCreatedEvent(room.id));
    return CreateSupportRoomResponseDto.parseEntity(room);
  }
}
