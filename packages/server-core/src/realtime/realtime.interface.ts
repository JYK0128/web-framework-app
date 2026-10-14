import type { SocketIoAdapterOptions } from '@pkg/server-core/realtime/adapters/socket-io.interface';
import type { RedisClientOptions } from 'redis';

export const REALTIME_MODULE_OPTIONS = Symbol('REALTIME_MODULE_OPTIONS');
export const SOCKET_IO_REDIS_KEY = 'web-framework:socket.io';

export interface RealtimeModuleOptions {
  socketIo?: SocketIoAdapterOptions
  sse?: { redis?: RedisClientOptions & { key?: string } }
}

export interface SocketTarget {
  namespace: string
  room?: string
}

export interface SocketClientPolicy<TData> {
  filter?: (data: TData) => boolean
  isActive?: (data: TData) => boolean | Promise<boolean>
}
