import { type DynamicModule, Global, Module } from '@nestjs/common';

import { LOGGER_MODULE_OPTIONS, type LoggerModuleOptions, LoggerService } from './logger.service';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(options?: LoggerModuleOptions): DynamicModule {
    return {
      module: LoggerModule,
      global: true,
      providers: [
        {
          provide: LOGGER_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        LoggerService,
      ],
      exports: [LoggerService],
    };
  }
}
