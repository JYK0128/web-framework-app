import { type DynamicModule, Global, Module, type Type } from '@nestjs/common';

import { LokiTelemetryProvider } from './providers/loki.provider';
import { type ITelemetryProvider, TELEMETRY_MODULE_OPTIONS, TELEMETRY_PROVIDER, type TelemetryModuleOptions } from './telemetry.interface';
import { TelemetryService } from './telemetry.service';

@Global()
@Module({})
export class TelemetryModule {
  static forRoot(options?: TelemetryModuleOptions): DynamicModule {
    const selectedProvider: Type<ITelemetryProvider> = LokiTelemetryProvider;

    return {
      module: TelemetryModule,
      global: true,
      providers: [
        {
          provide: TELEMETRY_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        LokiTelemetryProvider,
        {
          provide: TELEMETRY_PROVIDER,
          useExisting: selectedProvider,
        },
        TelemetryService,
      ],
      exports: [TelemetryService, TELEMETRY_PROVIDER],
    };
  }
}
