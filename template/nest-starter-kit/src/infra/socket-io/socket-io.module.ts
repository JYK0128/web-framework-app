import { type DynamicModule, Global, Module } from '@nestjs/common';

import { SocketIoAdapter } from './socket-io.adapter';
import { SOCKET_IO_MODULE_OPTIONS, type SocketIoModuleOptions } from './socket-io.interface';

@Global()
@Module({})
export class SocketIoModule {
  static forRoot(options?: SocketIoModuleOptions): DynamicModule {
    return {
      module: SocketIoModule,
      global: true,
      providers: [
        {
          provide: SOCKET_IO_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        SocketIoAdapter,
      ],
      exports: [SocketIoAdapter],
    };
  }
}
