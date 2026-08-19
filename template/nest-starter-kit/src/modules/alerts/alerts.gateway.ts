import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

import { RedisService } from '#/common/redis/redis.service';
import { AccessTokenService } from '#/common/security/access-token.service';
import { AuthCacheService, type CachedUserState } from '#/common/security/auth-cache.service';
import { AppEntityManager } from '#/database/entity-manager';

import type { AlertItemDto } from './dto/alert-item.dto';

type AlertSocketData = {
  user?: CachedUserState
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
    private readonly accessTokenService: AccessTokenService,
    private readonly authCacheService: AuthCacheService,
    private readonly em: AppEntityManager,
    private readonly redis: RedisService,
  ) {}

  handleConnection(client: Socket): Promise<void> {
    const authReady = RequestContext.create(this.em, () => this.authenticateConnection(client));
    const socketData: AlertSocketData = { authReady };
    client.data = socketData;
    return authReady;
  }

  sendAlertToUser(userId: string, alert: AlertItemDto): void {
    try {
      this.server?.to(`user:${userId}`).emit('alert-received', alert);
    }
    catch (err) {
      this.logger.warn(`Failed to send alert to user ${userId}: ${String(err)}`);
    }
  }

  broadcastAlert(alert: AlertItemDto): void {
    try {
      this.server?.emit('alert-received', alert);
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

      const claims = await this.accessTokenService.verifyAccessToken(token);
      if (await this.authCacheService.isTokenBlacklisted(claims.jti)) throw new Error('INVALID_TOKEN');

      const user = await this.authCacheService.getUserState(claims.userId);
      if (!user || user.isBanned || user.isDeleted) throw new Error('AUTHENTICATION_REQUIRED');

      const data = client.data as AlertSocketData;
      data.user = user;
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
    const sid = cookies.sid;
    if (!sid) return null;
    const session = await this.redis.get<{ user?: { id?: string }, accessToken?: string }>(`session:${sid}`);
    return session?.accessToken ?? null;
  }
}
