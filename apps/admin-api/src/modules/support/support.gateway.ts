import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

import { KvStore } from '#/core/kv-store/kv-store.service';
import { RealtimeService } from '#/core/realtime/realtime.service';
import { SOCKET_PATH } from '#/modules/support/support.config';

@WebSocketGateway({ namespace: '/support', path: SOCKET_PATH, cors: { origin: false } })
export class SupportGateway implements OnGatewayInit {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly kvStore: KvStore,
  ) {}

  afterInit(server: Namespace): void {
    this.realtime.registerSocketNamespace('/support', server);
  }

  @SubscribeMessage('support.join')
  async join(@ConnectedSocket() socket: Socket, @MessageBody() body: { ticket?: string }) {
    if (typeof body?.ticket !== 'string') return null;
    const ticket = await this.kvStore.getAndDelete<{ roomId: string }>(`admin:support:socket-ticket:${body.ticket}`);
    if (!ticket) return null;
    await socket.join(ticket.roomId);
    return ticket.roomId;
  }
}
