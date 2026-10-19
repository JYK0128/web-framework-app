import { type DynamicModule, Module } from '@nestjs/common';

import { SocketIoAdapter } from '#realtime/adapters/socket-io.adapter';
import { SSEAdapter } from '#realtime/adapters/sse.adapter';
import { REALTIME_MODULE_OPTIONS, type RealtimeModuleOptions } from '#realtime/realtime.interface';
import { RealtimeService } from '#realtime/realtime.service';

@Module({})
export class RealtimeModule {
  static forRoot(options?: RealtimeModuleOptions): DynamicModule {
    return {
      module: RealtimeModule,
      global: true,
      providers: [
        {
          provide: REALTIME_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        SSEAdapter,
        SocketIoAdapter,
        RealtimeService,
      ],
      exports: [RealtimeService, SocketIoAdapter, SSEAdapter],
    };
  }
}
