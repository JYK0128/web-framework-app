import { RequestContext } from '@mikro-orm/core';
import { HttpStatus, Inject } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import type { Namespace, Socket } from 'socket.io';

import { SupportRoom } from '#/core/database/entities/support';
import { AppEntityManager } from '#/core/database/entity-manager';

@WebSocketGateway({ namespace: '/support', path: '/api/v1/socket.io', cors: { origin: false } })
export class SupportGateway implements OnGatewayInit {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly em: AppEntityManager,
    @Inject(USER_AUTH_SERVICE) private readonly userAuth: IUserAuthService,
  ) {}

  afterInit(server: Namespace): void {
    this.realtime.registerSocketNamespace('/support', server);
  }

  @SubscribeMessage('support.join')
  async join(@ConnectedSocket() socket: Socket, @MessageBody() body: { roomId?: string }) {
    if (typeof body?.roomId !== 'string' || !body.roomId) return null;
    return RequestContext.create(this.em, async () => {
      const principal = await this.userAuth.authenticate(socket.request as Request);
      const room = await this.em.findOne(SupportRoom, { id: body.roomId, user: principal.id });
      if (!room) throw new ApplicationError({ code: 'SUPPORT_ROOM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
      await socket.join(room.id);
      return room.id;
    });
  }
}
