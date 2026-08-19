import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

import { RedisService } from '#/common/redis/redis.service';
import { AuthTokenService } from '#/common/security/auth-token.service';
import { type AuthPrincipal, toAuthPrincipal } from '#/common/security/auth-token.types';
import { AppEntityManager } from '#/database/entity-manager';

import type { AlertItemDto } from './dto/alert-item.dto';

type AlertSocketData = {
  user?: AuthPrincipal
  tokenJti?: string
  tokenIssuedAt?: number
  authReady?: Promise<void>
};

const SOCKET_PATH = '/api/v1/socket.io';

@Injectable()
@WebSocketGateway({
  namespace: '/alerts',
  path: SOCKET_PATH,
})
export class AlertsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(AlertsGateway.name);

  @WebSocketServer()
  private server!: Namespace;

  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly em: AppEntityManager,
    private readonly redis: RedisService,
  ) {}

  handleConnection(client: Socket): Promise<void> {
    const authReady = RequestContext.create(this.em, () => this.authenticateConnection(client));
    const socketData: AlertSocketData = { authReady };
    client.data = socketData;
    return authReady;
  }

  async sendAlertToUser(userId: string, alert: AlertItemDto): Promise<void> {
    try {
      for (const socket of this.server?.sockets?.values() ?? []) {
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
      this.logger.warn(`Failed to send alert to user ${userId}: ${String(err)}`);
    }
  }

  async broadcastAlert(alert: AlertItemDto): Promise<void> {
    try {
      for (const socket of this.server?.sockets?.values() ?? []) {
        const data = socket.data as AlertSocketData;
        if (await this.isBlocked(data)) {
          socket.disconnect(true);
          continue;
        }
        socket.emit('alert-received', alert);
      }
    }
    catch (err) {
      this.logger.warn(`Failed to broadcast alert: ${String(err)}`);
    }
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private async authenticateConnection(client: Socket): Promise<void> {
    try {
      const authorization = client.handshake.headers.authorization;
      const authorizationToken = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length).trim()
        : null;
      const token = authorizationToken ?? await this.getSessionAccessToken(client.handshake.headers.cookie);
      if (!token) throw new Error('AUTHENTICATION_REQUIRED');

      const claims = await this.authTokenService.verifyAccess(token);
      if (await this.authTokenService.isBlacklisted(claims.jti)
        || await this.authTokenService.isCutoff(claims.userId, claims.issuedAt)) {
        throw new Error('INVALID_TOKEN');
      }

      const user = toAuthPrincipal(claims);

      const data = client.data as AlertSocketData;
      data.user = user;
      data.tokenJti = claims.jti;
      data.tokenIssuedAt = claims.issuedAt;
      await client.join(this.userRoom(user.id));
      this.logger.debug(`Authenticated alert socket ${client.id} for user ${user.id}`);
    }
    catch (error) {
      const reason = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      this.logger.warn(`Rejected alert socket ${client.id}: ${reason}`);
      client.disconnect(true);
    }
  }

  private async getSessionAccessToken(cookieHeader?: string): Promise<string | null> {
    if (!cookieHeader) return null;
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      }),
    );
    const sessionId = cookies.session;
    if (!sessionId) return null;
    const session = await this.redis.get<{ accessToken?: string }>(`session:${sessionId}`);
    return session?.accessToken ?? null;
  }

  private async isBlocked(data: AlertSocketData): Promise<boolean> {
    if (!data.user || !data.tokenJti || data.tokenIssuedAt === undefined) return true;
    return await this.authTokenService.isBlacklisted(data.tokenJti)
      || await this.authTokenService.isCutoff(data.user.id, data.tokenIssuedAt);
  }
}
