import { type DynamicModule, Global, Module } from '@nestjs/common';
import { PortOneAdapter } from '@pkg/server-core/phone-identity/adapters/portone.adapter';

import { PHONE_IDENTITY_MODULE_OPTIONS, type PhoneIdentityModuleOptions } from './phone-identity.interface';
import { PhoneIdentityService } from './phone-identity.service';

@Global()
@Module({})
export class PhoneIdentityModule {
  static forRoot(options: PhoneIdentityModuleOptions): DynamicModule {
    return {
      module: PhoneIdentityModule,
      global: true,
      providers: [
        { provide: PHONE_IDENTITY_MODULE_OPTIONS, useValue: options },
        PortOneAdapter,
        PhoneIdentityService,
      ],
      exports: [PhoneIdentityService],
    };
  }
}
