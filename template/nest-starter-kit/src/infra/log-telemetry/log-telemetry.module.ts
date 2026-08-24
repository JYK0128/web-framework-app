import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { LokiLogTelemetryAdapter } from './adapters/loki.adapter';
import { type ILogTelemetryAdapter, LOG_TELEMETRY_ADAPTER, LOG_TELEMETRY_MODULE_OPTIONS, type LogTelemetryModuleOptions } from './log-telemetry.interface';
import { LogTelemetryService } from './log-telemetry.service';

@Module({})
export class LogTelemetryModule {
  static forRoot(options?: LogTelemetryModuleOptions): DynamicModule {
    const selectedAdapter: Type<ILogTelemetryAdapter> = LokiLogTelemetryAdapter;

    return {
      module: LogTelemetryModule,
      global: true,
      providers: [
        {
          provide: LOG_TELEMETRY_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        LokiLogTelemetryAdapter,
        {
          provide: LOG_TELEMETRY_ADAPTER,
          useExisting: selectedAdapter,
        },
        LogTelemetryService,
      ],
      exports: [LogTelemetryService],
    };
  }
}
