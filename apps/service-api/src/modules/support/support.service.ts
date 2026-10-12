import { HttpStatus, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { isWithinOperatingHours } from '@pkg/shared/policy';

import { SupportMessage, SupportMessageSenderType, SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { RealtimeService } from '#/core/realtime/realtime.service';
import { SystemContext } from '#/modules/system-configs/system.context';

import { CreateSupportMessageRequestDto, CreateSupportRoomRequestDto, GetSupportRoomsCursorRequestDto, GetSupportRoomsRequestDto, SupportMessageItemDto, SupportRoomCursorResponseDto, SupportRoomItemDto, SupportRoomPageResponseDto, UpdateSupportRoomRequestDto } from '.';
import { SupportRoomCreatedEvent } from './rooms/support-room-created.event';

@Injectable()
export class SupportService {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principal: PrincipalContext,
    private readonly eventBus: EventBus,
    private readonly systemContext: SystemContext,
    private readonly kvStore: KvStore,
    private readonly realtime: RealtimeService,
  ) {}

  async listRooms(input: GetSupportRoomsRequestDto, mine: boolean): Promise<SupportRoomPageResponseDto> {
    const user = mine ? this.principal.ensureUser() : null;
    const filters = {
      ...(user ? { user: user.id } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.search ? { $or: [{ title: { $ilike: `%${input.search}%` } }] } : {}),
    };
    const result = await this.em.findByPage(SupportRoom, filters, {
      ...input.toPageOptions(),
      populate: ['user.profile', 'assignee.profile'],
    });
    return SupportRoomPageResponseDto.parse({
      ...result,
      items: result.items.map((room) => SupportRoomItemDto.parseEntity(room)),
    });
  }

  async listMyRooms(input: GetSupportRoomsCursorRequestDto): Promise<SupportRoomCursorResponseDto> {
    const user = this.principal.ensureUser();
    const result = await this.em.findByCursor(SupportRoom, {
      where: {
        user: user.id,
        ...(input.status ? { status: input.status } : {}),
        ...(input.search ? { title: { $ilike: `%${input.search}%` } } : {}),
      },
      ...input.toCursorOptions(),
      populate: ['user.profile', 'assignee.profile'],
    });
    return SupportRoomCursorResponseDto.parse({
      items: result.items.map((room) => SupportRoomItemDto.parseEntity(room)),
      startCursor: result.startCursor,
      endCursor: result.endCursor,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      totalCount: result.totalCount,
    });
  }

  async getRoom(roomId: string, mine: boolean): Promise<SupportRoomItemDto> {
    return SupportRoomItemDto.parseEntity(await this.findRoom(roomId, mine));
  }

  async createRoom(input: CreateSupportRoomRequestDto): Promise<SupportRoomItemDto> {
    const user = this.principal.ensureUser();
    const content = input.content.trim();
    const now = new Date();
    const config = await this.systemContext.getConfig();
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
    return SupportRoomItemDto.parseEntity(room);
  }

  async listMessages(roomId: string, mine: boolean): Promise<SupportMessageItemDto[]> {
    const room = await this.findRoom(roomId, mine);
    const messages = await this.em.find(SupportMessage, { room: room.id }, { orderBy: { createdAt: 'ASC' }, populate: ['senderUser.profile'] });
    if (mine && messages.length > 0) {
      for (const message of messages) {
        if (message.senderType !== SupportMessageSenderType.USER && !message.readAt) message.readAt = new Date();
      }
    }
    return messages.map((message) => SupportMessageItemDto.parseEntity(message));
  }

  async createSocketTicket(roomId: string, mine: boolean): Promise<{ ticket: string }> {
    await this.findRoom(roomId, mine);
    const ticket = crypto.randomUUID();
    await this.kvStore.set(`service:support:socket-ticket:${ticket}`, { roomId }, 30);
    return { ticket };
  }

  consumeSocketTicket(ticket: string): Promise<{ roomId: string } | null> {
    return this.kvStore.getAndDelete(`service:support:socket-ticket:${ticket}`);
  }

  async createUserMessage(roomId: string, input: CreateSupportMessageRequestDto): Promise<SupportMessageItemDto> {
    const room = await this.findRoom(roomId, true);
    this.ensureOpen(room);
    const user = this.principal.ensureUser();
    const config = await this.systemContext.getConfig();
    const now = new Date();
    const message = await this.createMessage(room, input.content, SupportMessageSenderType.USER, user.id);
    let autoReply: SupportMessageItemDto | undefined;
    if (!isWithinOperatingHours(config.operation, now)) {
      autoReply = await this.createMessage(room, config.inquiry.offlineReplyMessage, SupportMessageSenderType.SYSTEM);
    }
    await this.em.flush();
    await this.publishRoomEvent(room.id, 'support.message.created');
    if (autoReply) await this.publishRoomEvent(room.id, 'support.message.created');
    return message;
  }

  async createAgentMessage(roomId: string, input: CreateSupportMessageRequestDto): Promise<SupportMessageItemDto> {
    const room = await this.findRoom(roomId, false);
    this.ensureOpen(room);
    const message = await this.createMessage(room, input.content, SupportMessageSenderType.AGENT);
    room.status = SupportRoomStatus.IN_PROGRESS;
    await this.em.flush();
    await this.publishRoomEvent(room.id, 'support.message.created');
    return message;
  }

  async updateRoom(roomId: string, input: UpdateSupportRoomRequestDto): Promise<SupportRoomItemDto> {
    const room = await this.findRoom(roomId, false);
    if (input.status !== undefined && room.status !== input.status) {
      room.status = input.status;
      await this.em.flush();
      await this.publishRoomEvent(room.id, 'support.room.status.changed');
    }
    return SupportRoomItemDto.parseEntity(room);
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

  async publishRoomEvent(roomId: string, event: 'support.message.created' | 'support.room.status.changed'): Promise<void> {
    await this.realtime.emitSocket({ namespace: '/support', room: roomId }, event, { roomId });
  }

  private async findRoom(roomId: string, mine: boolean): Promise<SupportRoom> {
    const user = mine ? this.principal.ensureUser() : null;
    const room = await this.em.findOne(SupportRoom, { id: roomId, ...(user ? { user: user.id } : {}) }, { populate: ['user.profile', 'assignee.profile'] });
    if (!room) throw new ApplicationError({ code: 'SUPPORT_ROOM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return room;
  }

  private ensureOpen(room: SupportRoom): void {
    if (room.status === SupportRoomStatus.CLOSED) throw new ApplicationError({ code: 'SUPPORT_ROOM_CLOSED', status: HttpStatus.CONFLICT });
  }
}
