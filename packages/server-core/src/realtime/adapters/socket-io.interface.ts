import type { RedisClientOptions } from 'redis';

export interface SocketIoAdapterOptions {
  redis?: RedisClientOptions & { key?: string }
}
