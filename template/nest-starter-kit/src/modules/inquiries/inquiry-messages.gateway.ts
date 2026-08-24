import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import type { AuthPrincipal } from 'express-session';
import type { DefaultEventsMap, Namespace, Socket } from 'socket.io';

import { SessionStore } from '#/common/stores/session.store';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { RealtimeService } from '#/infra/realtime';
import { CreateInquiryMessageCommand } from '#/modules/inquiries/commands';
import type { CreateInquiryMessageRequestDto, InquiryMessageItemDto } from '#/modules/inquiries/dto';

export type InquirySocketData = {
  user: AuthPrincipal
  sessionId: string
  canManage: boolean
  joinedInquiryId?: string
  isAdmin?: boolean
};

export type InquirySocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, InquirySocketData>;
export type InquiryNamespace = Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, InquirySocketData>;

type JoinInquiryPayload = {
  inquiryId?: string
  admin?: boolean
};

type SendMessagePayload = {
  content?: string
};

const SOCKET_PATH = '/api/v1/socket.io';
const SOCKET_NAMESPACE = '/inquiries';

@Injectable()
@WebSocketGateway({
  namespace: SOCKET_NAMESPACE,
  path: SOCKET_PATH,
})
export class InquiryMessagesGateway implements OnGatewayInit {
  private readonly logger = new Logger(InquiryMessagesGateway.name);

  constructor(
    private readonly sessionStore: SessionStore,
    private readonly commandBus: CommandBus,
    private readonly em: AppEntityManager,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: InquiryNamespace): void {
    this.realtime.registerSocketNamespace(SOCKET_NAMESPACE, server);
    server.use((client, next) => {
      void RequestContext.create(this.em, () => this.authenticateConnection(client))
        .then(() => next())
        .catch((error: unknown) => {
          const reason = ApplicationError.from(error, 'UNKNOWN_ERROR').message;
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
      return await this.realtime.hasSocketConnection<InquirySocketData>(
        { namespace: SOCKET_NAMESPACE, room: this.roomName(inquiryId) },
        {
          filter: (data) => data.user?.id === userId,
          isActive: async (data) => !await this.isBlocked(data),
        },
      );
    }
    catch {
      return false;
    }
  }

  private async authenticateConnection(client: InquirySocket): Promise<void> {
    const request = client.request as Request;
    const user = request.session.user;
    if (!user) throw new Error('AUTHENTICATION_REQUIRED');

    if (!request.sessionID) throw new Error('INVALID_TOKEN');

    client.data = {
      user,
      sessionId: request.sessionID,
      canManage: user.permissions.inquiry?.includes('manage') === true,
    };
  }

  @SubscribeMessage('join-inquiry')
  async joinInquiry(
    @ConnectedSocket() client: InquirySocket,
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
      client.data = { ...data, joinedInquiryId: inquiryId, isAdmin };

      return { joined: true, inquiryId };
    });
  }

  @SubscribeMessage('send-message')
  async sendMessage(
    @ConnectedSocket() client: InquirySocket,
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

      const message = await this.commandBus.execute(new CreateInquiryMessageCommand({
        inquiryId: data.joinedInquiryId,
        input: { content } satisfies CreateInquiryMessageRequestDto,
        authorId: data.user.id,
        isAdmin: data.isAdmin,
      }));
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

  private async getAuthenticatedData(client: InquirySocket): Promise<InquirySocketData> {
    const data = client.data;
    if (await this.isBlocked(data)) {
      client.disconnect(true);
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: 401 });
    }
    return data;
  }

  private async emitToInquiryRoom(inquiryId: string, event: string, payload: unknown): Promise<void> {
    try {
      await this.realtime.emitSocket<InquirySocketData>(
        { namespace: SOCKET_NAMESPACE, room: this.roomName(inquiryId) },
        event,
        payload,
        { isActive: async (data) => !await this.isBlocked(data) },
      );
    }
    catch {
      // Ignored if socket server not ready
    }
  }

  private async isBlocked(data: InquirySocketData): Promise<boolean> {
    return !await this.sessionStore.isActive(data.sessionId, data.user.id);
  }
}
