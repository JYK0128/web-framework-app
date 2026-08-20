import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import type { AuthPrincipal } from 'express-session';
import type { Namespace, Socket } from 'socket.io';

import { getErrorMessage } from '#/common/helpers/error.helper';
import { SessionStore } from '#/common/stores/session.store';
import { AppEntityManager } from '#/database/entity-manager';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { CreateInquiryMessageCommand } from '#/modules/inquiries/commands';
import type { CreateInquiryMessageRequestDto, InquiryMessageItemDto } from '#/modules/inquiries/dto';

type InquirySocketData = {
  user: AuthPrincipal
  sessionId: string
  canManage: boolean
  joinedInquiryId?: string
  isAdmin?: boolean
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
export class InquiryMessagesGateway implements OnGatewayInit {
  private readonly logger = new Logger(InquiryMessagesGateway.name);

  @WebSocketServer()
  private server!: Namespace;

  constructor(
    private readonly sessionStore: SessionStore,
    private readonly commandBus: CommandBus,
    private readonly em: AppEntityManager,
  ) {}

  afterInit(server: Namespace): void {
    server.use((client, next) => {
      void RequestContext.create(this.em, () => this.authenticateConnection(client))
        .then(() => next())
        .catch((error: unknown) => {
          const reason = getErrorMessage(error, 'UNKNOWN_ERROR');
          this.logger.warn(`Rejected inquiry socket ${client.id}: ${reason}`);
          next(new Error(reason));
        });
    });
  }

  async broadcastMessage(inquiryId: string, message: InquiryMessageItemDto): Promise<void> {
    await this.emitToInquiryRoom(inquiryId, 'inquiry-message', message);
  }

  async broadcastStatusChange(
    inquiryId: string,
    status: InquiryStatus,
    assignee?: { id: string, name: string | null } | null,
  ): Promise<void> {
    try {
      await this.emitToInquiryRoom(inquiryId, 'inquiry-status-changed', {
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

  async isUserInInquiryRoom(userId: string, inquiryId: string): Promise<boolean> {
    try {
      const sockets = await this.server.in(this.roomName(inquiryId)).fetchSockets();
      for (const socket of sockets) {
        const data = socket?.data as InquirySocketData | undefined;
        if (data?.user?.id !== userId) continue;
        if (!await this.isBlocked(data)) return true;
        socket.disconnect(true);
      }
      return false;
    }
    catch {
      return false;
    }
  }

  private async authenticateConnection(client: Socket): Promise<void> {
    const request = client.request as Request;
    const user = request.session.user;
    if (!user) throw new Error('AUTHENTICATION_REQUIRED');

    if (!request.sessionID) throw new Error('INVALID_TOKEN');

    client.data = {
      user,
      sessionId: request.sessionID,
      canManage: user.permissions.inquiry?.includes('manage') === true,
    } satisfies InquirySocketData;
    this.logger.debug(`Authenticated inquiry socket ${client.id} for user ${user.id}`);
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
      if (data.isAdmin && !data.canManage) {
        throw new ApplicationError({ code: 'FORBIDDEN', status: 403 });
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
      await this.emitToInquiryRoom(data.joinedInquiryId, 'inquiry-message', message);
      if (data.isAdmin) {
        await this.emitToInquiryRoom(data.joinedInquiryId, 'inquiry-status-changed', {
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

  private async getAuthenticatedData(client: Socket): Promise<InquirySocketData> {
    const data = client.data as InquirySocketData;
    if (await this.isBlocked(data)) {
      client.disconnect(true);
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: 401 });
    }
    return data;
  }

  private async emitToInquiryRoom(inquiryId: string, event: string, payload: unknown): Promise<void> {
    try {
      const sockets = await this.server.in(this.roomName(inquiryId)).fetchSockets();
      for (const socket of sockets) {
        const data = socket.data as InquirySocketData;
        if (await this.isBlocked(data)) {
          socket.disconnect(true);
          continue;
        }
        socket.emit(event, payload);
      }
    }
    catch {
      // Ignored if socket server not ready
    }
  }

  private async isBlocked(data: InquirySocketData): Promise<boolean> {
    return !await this.sessionStore.isActive(data.sessionId, data.user.id);
  }
}
