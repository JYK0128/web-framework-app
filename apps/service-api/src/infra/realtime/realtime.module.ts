import { type DynamicModule, Module } from '@nestjs/common';

import { SocketIoAdapter } from '#/infra/realtime/adapters/socket-io/socket-io.adapter';
import { SSEAdapter } from '#/infra/realtime/adapters/sse/sse.adapter';
import { REALTIME_MODULE_OPTIONS, type RealtimeModuleOptions } from '#/infra/realtime/realtime.interface';
import { RealtimeService } from '#/infra/realtime/realtime.service';

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
