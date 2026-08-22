import type { RedisClientOptions } from 'redis';

export const SOCKET_IO_MODULE_OPTIONS = Symbol('SOCKET_IO_MODULE_OPTIONS');

export interface SocketIoModuleOptions {
  redis?: RedisClientOptions
}
