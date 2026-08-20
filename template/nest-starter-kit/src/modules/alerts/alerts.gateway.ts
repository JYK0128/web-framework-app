import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Request } from 'express';
import type { AuthPrincipal } from 'express-session';
import type { Namespace, Socket } from 'socket.io';

import { getErrorMessage } from '#/common/helpers/error.helper';
import { SessionStore } from '#/common/stores/session.store';
import { AppEntityManager } from '#/database/entity-manager';

import type { AlertItemDto } from './dto/alert-item.dto';

type AlertSocketData = {
  user: AuthPrincipal
  sessionId: string
};

const SOCKET_PATH = '/api/v1/socket.io';

@Injectable()
@WebSocketGateway({
  namespace: '/alerts',
  path: SOCKET_PATH,
})
export class AlertsGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(AlertsGateway.name);

  @WebSocketServer()
  private server!: Namespace;

  constructor(
    private readonly sessionStore: SessionStore,
    private readonly em: AppEntityManager,
  ) {}

  afterInit(server: Namespace): void {
    server.use((client, next) => {
      void RequestContext.create(this.em, () => this.authenticateConnection(client))
        .then(() => next())
        .catch((error: unknown) => {
          const reason = getErrorMessage(error, 'UNKNOWN_ERROR');
          this.logger.warn(`Rejected alert socket ${client.id}: ${reason}`);
          next(new Error(reason));
        });
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const data = client.data as AlertSocketData;
    await client.join(this.userRoom(data.user.id));
  }

  async sendAlertToUser(userId: string, alert: AlertItemDto): Promise<void> {
    try {
      const sockets = await this.server.in(this.userRoom(userId)).fetchSockets();
      for (const socket of sockets) {
        const data = socket.data as AlertSocketData;
        if (data.user?.id !== userId) continue;
        if (await this.isBlocked(data)) {
          socket.disconnect(true);
          continue;
        }
        socket.emit('alert-received', alert);
      }
    }
    catch (err) {
      this.logger.warn(`Failed to send alert to user ${userId}: ${getErrorMessage(err, 'UNKNOWN_ERROR')}`);
    }
  }

  async broadcastAlert(alert: AlertItemDto): Promise<void> {
    try {
      const sockets = await this.server.fetchSockets();
      for (const socket of sockets) {
        const data = socket.data as AlertSocketData;
        if (await this.isBlocked(data)) {
          socket.disconnect(true);
          continue;
        }
        socket.emit('alert-received', alert);
      }
    }
    catch (err) {
      this.logger.warn(`Failed to broadcast alert: ${getErrorMessage(err, 'UNKNOWN_ERROR')}`);
    }
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private async authenticateConnection(client: Socket): Promise<void> {
    const request = client.request as Request;
    const user = request.session.user;
    if (!user) throw new Error('AUTHENTICATION_REQUIRED');

    if (!request.sessionID) throw new Error('INVALID_TOKEN');

    client.data = {
      user,
      sessionId: request.sessionID,
    } satisfies AlertSocketData;
    this.logger.debug(`Authenticated alert socket ${client.id} for user ${user.id}`);
  }

  private async isBlocked(data: AlertSocketData): Promise<boolean> {
    return !await this.sessionStore.isActive(data.sessionId, data.user.id);
  }
}
