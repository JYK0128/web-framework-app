import type { SocketIoAdapterOptions } from './adapters/socket-io/socket-io.interface';

export const REALTIME_MODULE_OPTIONS = Symbol('REALTIME_MODULE_OPTIONS');

export interface RealtimeModuleOptions {
  socketIo?: SocketIoAdapterOptions
}

export interface SocketTarget {
  namespace: string
  room?: string
}

export interface SocketClientPolicy<TData> {
  filter?: (data: TData) => boolean
  isActive?: (data: TData) => boolean | Promise<boolean>
}
