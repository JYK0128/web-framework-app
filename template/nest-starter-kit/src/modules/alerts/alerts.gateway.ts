import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import type { AuthPrincipal } from 'express-session';
import type { DefaultEventsMap, Namespace, Socket } from 'socket.io';

import { SessionStore } from '#/common/stores/session.store';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { RealtimeService } from '#/infra/realtime';

import type { AlertItemDto } from './dto/alert-item.dto';

export type AlertSocketData = {
  user: AuthPrincipal
  sessionId: string
};

export type AlertSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, AlertSocketData>;
export type AlertNamespace = Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, AlertSocketData>;

const SOCKET_PATH = '/api/v1/socket.io';
const SOCKET_NAMESPACE = '/alerts';

@Injectable()
@WebSocketGateway({
  namespace: SOCKET_NAMESPACE,
  path: SOCKET_PATH,
})
export class AlertsGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(AlertsGateway.name);

  constructor(
    private readonly sessionStore: SessionStore,
    private readonly em: AppEntityManager,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: AlertNamespace): void {
    this.realtime.registerSocketNamespace(SOCKET_NAMESPACE, server);
    server.use((client, next) => {
      void RequestContext.create(this.em, () => this.authenticateConnection(client))
        .then(() => next())
        .catch((error: unknown) => {
          const reason = ApplicationError.from(error, 'UNKNOWN_ERROR').message;
          this.logger.warn(`Rejected alert socket ${client.id}: ${reason}`);
          next(new Error(reason));
        });
    });
  }

  async handleConnection(client: AlertSocket): Promise<void> {
    await client.join(this.userRoom(client.data.user.id));
  }

  async sendAlertToUser(userId: string, alert: AlertItemDto): Promise<void> {
    try {
      await this.realtime.emitSocket<AlertSocketData>(
        { namespace: SOCKET_NAMESPACE, room: this.userRoom(userId) },
        'alert-received',
        alert,
        {
          filter: (data) => data.user?.id === userId,
          isActive: async (data) => !await this.isBlocked(data),
        },
      );
    }
    catch (err) {
      this.logger.warn(`Failed to send alert to user ${userId}: ${ApplicationError.from(err, 'UNKNOWN_ERROR').message}`);
    }
  }

  async broadcastAlert(alert: AlertItemDto): Promise<void> {
    try {
      await this.realtime.emitSocket<AlertSocketData>(
        { namespace: SOCKET_NAMESPACE },
        'alert-received',
        alert,
        { isActive: async (data) => !await this.isBlocked(data) },
      );
    }
    catch (err) {
      this.logger.warn(`Failed to broadcast alert: ${ApplicationError.from(err, 'UNKNOWN_ERROR').message}`);
    }
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private async authenticateConnection(client: AlertSocket): Promise<void> {
    const request = client.request as Request;
    const user = request.session.user;
    if (!user) throw new Error('AUTHENTICATION_REQUIRED');

    if (!request.sessionID) throw new Error('INVALID_TOKEN');

    client.data = {
      user,
      sessionId: request.sessionID,
    };
  }

  private async isBlocked(data: AlertSocketData): Promise<boolean> {
    return !await this.sessionStore.isActive(data.sessionId, data.user.id);
  }
}
