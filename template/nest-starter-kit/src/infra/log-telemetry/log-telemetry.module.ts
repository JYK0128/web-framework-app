import { type DynamicModule, Global, Module, type Type } from '@nestjs/common';

import { LokiLogTelemetryProvider } from './providers/loki.provider';
import { type ILogTelemetryProvider, LOG_TELEMETRY_MODULE_OPTIONS, LOG_TELEMETRY_PROVIDER, type LogTelemetryModuleOptions } from './log-telemetry.interface';
import { LogTelemetryService } from './log-telemetry.service';

@Global()
@Module({})
export class LogTelemetryModule {
  static forRoot(options?: LogTelemetryModuleOptions): DynamicModule {
    const selectedProvider: Type<ILogTelemetryProvider> = LokiLogTelemetryProvider;

    return {
      module: LogTelemetryModule,
      global: true,
      providers: [
        {
          provide: LOG_TELEMETRY_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        LokiLogTelemetryProvider,
        {
          provide: LOG_TELEMETRY_PROVIDER,
          useExisting: selectedProvider,
        },
        LogTelemetryService,
      ],
      exports: [LogTelemetryService, LOG_TELEMETRY_PROVIDER],
    };
  }
}
