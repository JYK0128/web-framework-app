import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ApplicationError } from '@pkg/shared/common';
import type { Namespace, Socket } from 'socket.io';

import { RedisService } from '#/common/redis/redis.service';
import { AccessTokenService } from '#/common/security/access-token.service';
import { AuthCacheService, type CachedUserState } from '#/common/security/auth-cache.service';
import { AppEntityManager } from '#/database/entity-manager';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { CreateInquiryMessageCommand } from '#/modules/inquiries/commands';
import type { CreateInquiryMessageRequestDto, InquiryMessageItemDto } from '#/modules/inquiries/dto';

type InquirySocketData = {
  user?: CachedUserState
  canManage?: boolean
  joinedInquiryId?: string
  isAdmin?: boolean
  authReady?: Promise<void>
};

type JoinInquiryPayload = {
  inquiryId?: string
  admin?: boolean
};

type SendMessagePayload = {
  content?: string
};

const SOCKET_PATH = '/api/v1/socket.io';

@Injectable()
@WebSocketGateway({
  namespace: '/inquiries',
  path: SOCKET_PATH,
})
export class InquiryMessagesGateway implements OnGatewayConnection {
  private readonly logger = new Logger(InquiryMessagesGateway.name);

  @WebSocketServer()
  private server!: Namespace;

  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly authCacheService: AuthCacheService,
    private readonly commandBus: CommandBus,
    private readonly em: AppEntityManager,
    private readonly redis: RedisService,
  ) {}

  handleConnection(client: Socket): Promise<void> {
    const authReady = RequestContext.create(this.em, () => this.authenticateConnection(client));
    const socketData: InquirySocketData = { authReady };
    client.data = socketData;
    return authReady;
  }

  broadcastMessage(inquiryId: string, message: InquiryMessageItemDto): void {
    this.server?.to(this.roomName(inquiryId)).emit('inquiry-message', message);
  }

  broadcastStatusChange(
    inquiryId: string,
    status: InquiryStatus,
    assignee?: { id: string, name: string | null } | null,
  ): void {
    try {
      this.server?.to(this.roomName(inquiryId)).emit('inquiry-status-changed', {
        inquiryId,
        status,
        assigneeId: assignee?.id,
        assigneeName: assignee?.name,
      });
    }
    catch {
      // Ignored if socket server not ready
    }
  }

  isUserInInquiryRoom(userId: string, inquiryId: string): boolean {
    try {
      const room = this.server?.adapter?.rooms?.get(this.roomName(inquiryId));
      if (!room || room.size === 0) return false;

      for (const socketId of room) {
        const socket = this.server?.sockets?.get(socketId);
        const data = socket?.data as InquirySocketData | undefined;
        if (data?.user?.id === userId) {
          return true;
        }
      }
      return false;
    }
    catch {
      return false;
    }
  }

  private async authenticateConnection(client: Socket): Promise<void> {
    try {
      const authorization = client.handshake.headers.authorization;
      const authorizationToken = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length).trim()
        : null;
      const token = authorizationToken ?? await this.getSessionAccessToken(client.handshake.headers.cookie);
      if (!token) throw new Error('AUTHENTICATION_REQUIRED');

      const claims = await this.accessTokenService.verifyAccessToken(token);
      if (await this.authCacheService.isTokenBlacklisted(claims.jti)) throw new Error('INVALID_TOKEN');

      const user = await this.authCacheService.getUserState(claims.userId);
      if (!user || user.isBanned || user.isDeleted) throw new Error('AUTHENTICATION_REQUIRED');

      const permissions = await this.authCacheService.getRolePermissions(user.role ?? 'user');
      const canManage = permissions?.inquiry?.includes('manage') === true;
      const data = client.data as InquirySocketData;
      data.user = user;
      data.canManage = canManage;
      this.logger.debug(`Authenticated socket ${client.id} for user ${user.id}`);
    }
    catch (error) {
      const reason = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      this.logger.warn(`Rejected socket ${client.id}: ${reason}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join-inquiry')
  async joinInquiry(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinInquiryPayload,
  ): Promise<{ joined: boolean, inquiryId: string }> {
    return RequestContext.create(this.em, async () => {
      const data = await this.getAuthenticatedData(client);
      const inquiryId = payload.inquiryId?.trim();
      if (!inquiryId) throw new ApplicationError({ code: 'VALIDATION_ERROR', status: 400 });

      const isAdmin = payload.admin === true;
      if (isAdmin && !data.canManage) {
        throw new ApplicationError({ code: 'FORBIDDEN', status: 403 });
      }

      const inquiry = await this.em.findOne(
        Inquiry,
        isAdmin ? { id: inquiryId } : { id: inquiryId, user: data.user.id },
        { filters: isAdmin ? false : undefined },
      );
      if (!inquiry || inquiry.deletedAt) {
        throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: 404 });
      }

      if (data.joinedInquiryId) {
        await client.leave(this.roomName(data.joinedInquiryId));
      }
      await client.join(this.roomName(inquiryId));
      client.data = { ...data, joinedInquiryId: inquiryId, isAdmin } satisfies InquirySocketData;

      return { joined: true, inquiryId };
    });
  }

  @SubscribeMessage('send-message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<InquiryMessageItemDto> {
    return RequestContext.create(this.em, async () => {
      const data = await this.getAuthenticatedData(client);
      if (!data.joinedInquiryId || data.isAdmin === undefined) {
        throw new ApplicationError({ code: 'INQUIRY_NOT_JOINED', status: 400 });
      }

      const content = payload.content?.trim() ?? '';
      if (!content || content.length > 5000) {
        throw new ApplicationError({ code: 'VALIDATION_ERROR', status: 400 });
      }

      const message = await this.commandBus.execute<CreateInquiryMessageCommand, InquiryMessageItemDto>(new CreateInquiryMessageCommand(
        data.joinedInquiryId,
        { content } satisfies CreateInquiryMessageRequestDto,
        data.user.id,
        data.isAdmin,
      ));
      await this.em.flush();
      this.server.to(this.roomName(data.joinedInquiryId)).emit('inquiry-message', message);
      if (data.isAdmin) {
        this.server.to(this.roomName(data.joinedInquiryId)).emit('inquiry-status-changed', {
          inquiryId: data.joinedInquiryId,
          status: InquiryStatus.ANSWERED,
          assigneeId: data.user.id,
          assigneeName: data.user.name || data.user.email || null,
        });
      }
      return message;
    });
  }

  private roomName(inquiryId: string): string {
    return `inquiry:${inquiryId}`;
  }

  private async getAuthenticatedData(client: Socket): Promise<InquirySocketData & { user: CachedUserState }> {
    const data = client.data as InquirySocketData;
    if (data.authReady) await data.authReady;
    if (!data.user) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: 401 });
    return data as InquirySocketData & { user: CachedUserState };
  }

  private async getSessionAccessToken(cookieHeader: string | undefined): Promise<string | null> {
    const sessionCookie = cookieHeader
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('session='));
    const sessionId = sessionCookie?.slice('session='.length);
    if (!sessionId) return null;

    const session = await this.redis.get<{ accessToken?: string }>(`session:${sessionId}`);
    return session?.accessToken ?? null;
  }
}
