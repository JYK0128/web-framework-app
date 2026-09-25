import { HttpStatus, Injectable, type MessageEvent } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { concat, type Observable, of, Subject } from 'rxjs';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { User } from '#/entities/auth/user.entity';
import { SupportMessage, SupportMessageSenderType } from '#/entities/support/support-message.entity';
import { SupportRoom, SupportRoomStatus } from '#/entities/support/support-room.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { CreateSupportMessageRequestDto, CreateSupportRoomRequestDto, GetSupportRoomsRequestDto, SupportMessageItemDto, SupportRoomItemDto, SupportRoomListResponseDto, UpdateSupportRoomRequestDto } from './dto';

const SUPPORT_GREETING = '안녕하세요! 무엇을 도와 드릴까요?\n궁금한 내용을 남겨 주시면 상담원이 확인해 드리겠습니다.';

@Injectable()
export class SupportService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async listRooms(input: GetSupportRoomsRequestDto, mine: boolean): Promise<SupportRoomListResponseDto> {
    const user = mine ? this.principal.ensureUser() : null;
    const filters = {
      ...(user ? { user: user.id } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.search ? { $or: [{ title: { $ilike: `%${input.search}%` } }] } : {}),
    };
    const result = await this.em.findByPage(SupportRoom, filters, {
      page: input.page,
      limit: input.limit,
      orderBy: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      populate: ['user', 'assignee'],
    });
    return {
      ...result,
      items: result.items.map((room) => this.toRoomDto(room)),
    };
  }

  async getRoom(roomId: string, mine: boolean): Promise<SupportRoomItemDto> {
    return this.toRoomDto(await this.findRoom(roomId, mine));
  }

  async createRoom(input: CreateSupportRoomRequestDto): Promise<SupportRoomItemDto> {
    const user = this.principal.ensureUser();
    const content = input.content.trim();
    const now = new Date();
    const room = this.em.create(SupportRoom, {
      title: content.slice(0, 40),
      user: user.id,
      status: SupportRoomStatus.OPEN,
      lastMessageAt: now,
    });
    const greeting = this.em.create(SupportMessage, {
      room,
      senderType: SupportMessageSenderType.SYSTEM,
      content: SUPPORT_GREETING,
      createdAt: new Date(now.getTime() - 1),
    });
    const message = this.em.create(SupportMessage, {
      room,
      senderUser: user.id,
      senderType: SupportMessageSenderType.USER,
      content,
      createdAt: now,
    });
    this.em.persist([room, greeting, message]);
    return this.toRoomDto(room);
  }

  async listMessages(roomId: string, mine: boolean): Promise<SupportMessageItemDto[]> {
    const room = await this.findRoom(roomId, mine);
    const messages = await this.em.find(SupportMessage, { room: room.id }, { orderBy: { createdAt: 'ASC' }, populate: ['senderUser'] });
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
    const message = await this.createMessage(room, input.content, SupportMessageSenderType.USER, user.id);
    await this.em.flush();
    this.publishMessage(room.id, message);
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
    const room = await this.em.findOne(SupportRoom, { id: roomId, ...(user ? { user: user.id } : {}) }, { populate: ['user', 'assignee'] });
    if (!room) throw new ApplicationError({ code: 'SUPPORT_ROOM_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '고객지원 상담방을 찾을 수 없습니다.' });
    return room;
  }

  private ensureOpen(room: SupportRoom): void {
    if (room.status === SupportRoomStatus.CLOSED) throw new ApplicationError({ code: 'SUPPORT_ROOM_CLOSED', status: HttpStatus.CONFLICT, message: '종료된 상담방입니다.' });
  }

  private toRoomDto(room: SupportRoom): SupportRoomItemDto {
    const user = room.user as User | string;
    const assignee = room.assignee as User | string | null | undefined;
    return {
      id: room.id,
      title: room.title,
      status: room.status,
      userId: typeof user === 'string' ? user : user.id,
      userName: typeof user === 'string' ? '' : user.name,
      assigneeName: typeof assignee === 'object' && assignee ? assignee.name : null,
      lastMessageAt: room.lastMessageAt ?? null,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  private toMessageDto(message: SupportMessage): SupportMessageItemDto {
    const room = message.room as SupportRoom | string;
    const sender = message.senderUser as User | string | null | undefined;
    let senderName = message.senderType === SupportMessageSenderType.AGENT ? '상담원' : '시스템';
    if (typeof sender === 'object' && sender) senderName = sender.name;
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
