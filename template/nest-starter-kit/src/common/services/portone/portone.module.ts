import { type DynamicModule, Global, Module } from '@nestjs/common';

import { PORTONE_MODULE_OPTIONS, type PortOneModuleOptions } from '#/common/services/portone/portone.interface';
import { PortOneService } from '#/common/services/portone/portone.service';

@Global()
@Module({})
export class PortOneModule {
  static forRoot(options?: PortOneModuleOptions): DynamicModule {
    return {
      module: PortOneModule,
      providers: [
        {
          provide: PORTONE_MODULE_OPTIONS,
          useValue: options || {},
        },
        PortOneService,
      ],
      exports: [PortOneService],
    };
  }
}
