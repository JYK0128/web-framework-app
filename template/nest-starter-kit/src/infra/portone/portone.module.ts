import { type DynamicModule, Global, Module } from '@nestjs/common';

import { PORTONE_MODULE_OPTIONS, type PortOneModuleOptions } from '#/infra/portone/portone.interface';
import { PortOneService } from '#/infra/portone/portone.service';

@Global()
@Module({})
export class PortOneModule {
  static forRoot(options?: PortOneModuleOptions): DynamicModule {
    return {
      module: PortOneModule,
      global: true,
      providers: [
        {
          provide: PORTONE_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        PortOneService,
      ],
      exports: [PortOneService],
    };
  }
}
