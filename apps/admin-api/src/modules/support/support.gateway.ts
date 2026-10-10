import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

import { SOCKET_PATH } from '#/common/configs/runtime.config';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { RealtimeService } from '#/infra/realtime/realtime.service';

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
    if (typeof body?.ticket !== 'string') return { ok: false };
    const ticket = await this.kvStore.getAndDelete<{ roomId: string }>(`admin:support:socket-ticket:${body.ticket}`);
    if (!ticket) return { ok: false };
    await socket.join(ticket.roomId);
    return { ok: true, roomId: ticket.roomId };
  }
}
