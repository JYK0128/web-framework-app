import { Global, Module } from '@nestjs/common';

import { PortoneIdentityAdapter } from '#/core/phone-identity/adapters/portone-identity.adapter';

import { PortoneIdentityService } from './portone-identity.service';

@Global()
@Module({
  providers: [PortoneIdentityAdapter, PortoneIdentityService],
  exports: [PortoneIdentityService],
})
export class IdentityModule {}
