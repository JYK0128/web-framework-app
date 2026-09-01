import { Injectable, type MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

import { SocketIoAdapter } from './adapters/socket-io/socket-io.adapter';
import { SSEAdapter } from './adapters/sse/sse.adapter';
import type { SSEEvent } from './adapters/sse/sse.interface';
import type { SocketClientPolicy, SocketTarget } from './realtime.interface';

@Injectable()
export class RealtimeService {
  constructor(
    private readonly sseAdapter: SSEAdapter,
    private readonly socketIoAdapter: SocketIoAdapter,
  ) {}

  registerSocketNamespace(namespace: string, server: unknown): void {
    this.socketIoAdapter.registerNamespace(namespace, server);
  }

  emitSocket<TData>(
    target: SocketTarget,
    event: string,
    payload: unknown,
    policy?: SocketClientPolicy<TData>,
  ): Promise<number> {
    return this.socketIoAdapter.emit(target, event, payload, policy);
  }

  hasSocketConnection<TData>(target: SocketTarget, policy?: SocketClientPolicy<TData>): Promise<boolean> {
    return this.socketIoAdapter.hasConnection(target, policy);
  }

  streamSSE(topic: string): Observable<MessageEvent> {
    return this.sseAdapter.stream(topic);
  }

  bridgeSSE<TData extends string | object>(topic: string, source: Observable<SSEEvent<TData>>): Observable<MessageEvent> {
    return this.sseAdapter.bridge(topic, source);
  }

  publishSSE<TData extends string | object>(topic: string, event: SSEEvent<TData>): number {
    return this.sseAdapter.publish(topic, event);
  }

  broadcastSSE<TData extends string | object>(event: SSEEvent<TData>): number {
    return this.sseAdapter.broadcast(event);
  }
}
