import { RequestContext } from '@mikro-orm/core';
import { Inject } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth';
import { RealtimeService } from '@pkg/server-core/realtime';
import type { Request } from 'express';
import type { Namespace, Socket } from 'socket.io';

import { AppEntityManager } from '~/core/database/entity-manager';
import { GetUserSupportRoomQuery } from '~/modules/support/room/get-user-support-room.query';

@WebSocketGateway({ namespace: '/support', path: '/api/v1/socket.io', cors: { origin: false } })
export class SupportGateway implements OnGatewayInit {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly em: AppEntityManager,
    private readonly queryBus: QueryBus,
    @Inject(USER_AUTH_SERVICE) private readonly userAuth: IUserAuthService,
  ) {}

  afterInit(server: Namespace): void {
    this.realtime.registerSocketNamespace('/support', server);
  }

  @SubscribeMessage('support.join')
  async join(@ConnectedSocket() socket: Socket, @MessageBody() body: { roomId?: string }) {
    if (typeof body?.roomId !== 'string' || !body.roomId) return null;
    const roomId = body.roomId;
    return RequestContext.create(this.em, async () => {
      const principal = await this.userAuth.authenticate(socket.request as Request);
      const room = await this.queryBus.execute(new GetUserSupportRoomQuery({ roomId, userId: principal.id }));
      await socket.join(room.id);
      return room.id;
    });
  }
}
