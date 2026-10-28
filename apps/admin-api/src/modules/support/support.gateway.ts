import { RequestContext } from '@mikro-orm/core';
import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { Permissions, UserAuth } from '@pkg/server-core/http/decorators';
import { RealtimeService } from '@pkg/server-core/realtime';
import { AdminPermission } from '@pkg/shared';
import type { Namespace, Socket } from 'socket.io';

import { InternalClient } from '~/core/internal-client';

@WebSocketGateway({ namespace: '/support', path: '/api/v1/socket.io', cors: { origin: false } })
export class SupportGateway implements OnGatewayInit {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly em: AppEntityManager,
    private readonly internalClient: InternalClient,
  ) {}

  afterInit(server: Namespace): void {
    this.realtime.registerSocketNamespace('/support', server);
  }

  @SubscribeMessage('support.join')
  @UserAuth()
  @Permissions(AdminPermission.support.read)
  async join(@ConnectedSocket() socket: Socket, @MessageBody() body: { roomId?: string }) {
    if (typeof body?.roomId !== 'string' || !body.roomId) return null;
    return RequestContext.create(this.em, async () => {
      await this.internalClient.fetch(`/internal/support/rooms/${encodeURIComponent(body.roomId!)}`);
      await socket.join(body.roomId!);
      return body.roomId;
    });
  }
}
