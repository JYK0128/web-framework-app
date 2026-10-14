import { type DynamicModule, Module } from '@nestjs/common';
import { SocketIoAdapter } from '@pkg/server-core/realtime/adapters/socket-io.adapter';
import { SSEAdapter } from '@pkg/server-core/realtime/adapters/sse.adapter';
import { REALTIME_MODULE_OPTIONS, type RealtimeModuleOptions } from '@pkg/server-core/realtime/realtime.interface';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';

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
