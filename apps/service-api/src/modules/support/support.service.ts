import { HttpStatus, Injectable, type MessageEvent } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ApplicationError, isWithinOperatingHours } from '@pkg/shared/common';
import { concat, type Observable, of, Subject } from 'rxjs';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { User } from '#/entities/auth/user.entity';
import { SupportMessage, SupportMessageSenderType } from '#/entities/support/support-message.entity';
import { SupportRoom, SupportRoomStatus } from '#/entities/support/support-room.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { SystemContext } from '#/modules/system-configs/system.context';

import { CreateSupportMessageRequestDto, CreateSupportRoomRequestDto, GetSupportRoomsCursorRequestDto, GetSupportRoomsRequestDto, SupportMessageItemDto, SupportRoomCursorResponseDto, SupportRoomItemDto, SupportRoomPageResponseDto, UpdateSupportRoomRequestDto } from './dto';
import { SupportRoomCreatedEvent } from './support-room-created.event';

@Injectable()
export class SupportService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly em: AppEntityManager,
    private readonly principal: PrincipalContext,
    private readonly eventBus: EventBus,
    private readonly systemContext: SystemContext,
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
    return {
      ...result,
      items: result.items.map((room) => this.toRoomDto(room)),
    };
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
    return SupportRoomCursorResponseDto.fromPlain({
      items: result.items.map((room) => this.toRoomDto(room)),
      startCursor: result.startCursor,
      endCursor: result.endCursor,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      totalCount: result.totalCount,
    });
  }

  async getRoom(roomId: string, mine: boolean): Promise<SupportRoomItemDto> {
    return this.toRoomDto(await this.findRoom(roomId, mine));
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
    return this.toRoomDto(room);
  }

  async listMessages(roomId: string, mine: boolean): Promise<SupportMessageItemDto[]> {
    const room = await this.findRoom(roomId, mine);
    const messages = await this.em.find(SupportMessage, { room: room.id }, { orderBy: { createdAt: 'ASC' }, populate: ['senderUser.profile'] });
    if (mine && messages.length > 0) {
      for (const message of messages) {
        if (message.senderType !== SupportMessageSenderType.USER && !message.readAt) message.readAt = new Date();
      }
    }
    return messages.map((message) => this.toMessageDto(message));
  }

  async streamRoomEvents(roomId: string, mine: boolean): Promise<Observable<MessageEvent>> {
    await this.findRoom(roomId, mine);
    return concat(
      of<MessageEvent>({ type: 'support.connected', data: { roomId } }),
      this.getStream(roomId).asObservable(),
    );
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
    this.publishMessage(room.id, message);
    if (autoReply) this.publishMessage(room.id, autoReply);
    return message;
  }

  async createAgentMessage(roomId: string, input: CreateSupportMessageRequestDto): Promise<SupportMessageItemDto> {
    const room = await this.findRoom(roomId, false);
    this.ensureOpen(room);
    const message = await this.createMessage(room, input.content, SupportMessageSenderType.AGENT);
    room.status = SupportRoomStatus.IN_PROGRESS;
    await this.em.flush();
    this.publishMessage(room.id, message);
    return message;
  }

  async updateRoom(roomId: string, input: UpdateSupportRoomRequestDto): Promise<SupportRoomItemDto> {
    const room = await this.findRoom(roomId, false);
    if (input.status !== undefined) room.status = input.status;
    return this.toRoomDto(room);
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
    return this.toMessageDto(message);
  }

  private publishMessage(roomId: string, message: SupportMessageItemDto): void {
    this.getStream(roomId).next({
      type: 'support.message.created',
      data: message,
      id: message.id,
    });
  }

  broadcastRoomStatusChanged(roomId: string, status: SupportRoomStatus): void {
    this.getStream(roomId).next({
      type: 'support.room.status.changed',
      data: { roomId, status },
    });
  }

  private getStream(roomId: string): Subject<MessageEvent> {
    let stream = this.streams.get(roomId);
    if (!stream) {
      stream = new Subject<MessageEvent>();
      this.streams.set(roomId, stream);
    }
    return stream;
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

  private toRoomDto(room: SupportRoom): SupportRoomItemDto {
    const user = room.user as User | string;
    const assignee = room.assignee as User | string | null | undefined;
    const userProfile = typeof user === 'string' ? undefined : user.profile;
    const assigneeProfile = typeof assignee === 'object' && assignee ? assignee.profile : undefined;
    if (typeof user !== 'string' && !userProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    if (typeof assignee === 'object' && assignee && !assigneeProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return {
      id: room.id,
      title: room.title,
      status: room.status,
      userId: typeof user === 'string' ? user : user.id,
      userName: userProfile?.name ?? '',
      assigneeName: assigneeProfile?.name ?? null,
      lastMessageAt: room.lastMessageAt ?? null,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  private toMessageDto(message: SupportMessage): SupportMessageItemDto {
    const room = message.room as SupportRoom | string;
    const sender = message.senderUser as User | string | null | undefined;
    let senderName = message.senderType === SupportMessageSenderType.AGENT ? '상담원' : '시스템';
    if (typeof sender === 'object' && sender) {
      if (!sender.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      senderName = sender.profile.name;
    }
    return {
      id: message.id,
      roomId: typeof room === 'string' ? room : room.id,
      senderUserId: typeof sender === 'string' ? sender : sender?.id ?? null,
      senderName,
      senderType: message.senderType,
      content: message.content,
      readAt: message.readAt ?? null,
      createdAt: message.createdAt,
    };
  }
}
