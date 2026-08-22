import { type DynamicModule, Global, Module } from '@nestjs/common';

import { IDENTITY_VERIFICATION_MODULE_OPTIONS, IDENTITY_VERIFICATION_PROVIDER, type IdentityVerificationModuleOptions } from './identity-verification.interface';
import { IdentityVerificationService } from './identity-verification.service';
import { PortOneIdentityVerificationProvider } from './providers/portone.provider';

@Global()
@Module({})
export class IdentityVerificationModule {
  static forRoot(options?: IdentityVerificationModuleOptions): DynamicModule {
    return {
      module: IdentityVerificationModule,
      providers: [
        {
          provide: IDENTITY_VERIFICATION_MODULE_OPTIONS,
          useValue: options || {},
        },
        {
          provide: IDENTITY_VERIFICATION_PROVIDER,
          useClass: PortOneIdentityVerificationProvider,
        },
        IdentityVerificationService,
      ],
      exports: [IdentityVerificationService],
    };
  }
}
