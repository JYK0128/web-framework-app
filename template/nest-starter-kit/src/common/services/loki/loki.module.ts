import { type DynamicModule, Global, Module } from '@nestjs/common';

import { LOKI_MODULE_OPTIONS, type LokiModuleOptions, LokiService } from './loki.service';

@Global()
@Module({})
export class LokiModule {
  static forRoot(options?: LokiModuleOptions): DynamicModule {
    return {
      module: LokiModule,
      global: true,
      providers: [
        {
          provide: LOKI_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        LokiService,
      ],
      exports: [LokiService],
    };
  }
}
