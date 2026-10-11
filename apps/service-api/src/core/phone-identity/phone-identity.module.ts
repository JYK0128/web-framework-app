import { Global, Module } from '@nestjs/common';

import { PortOneAdapter } from '#/core/phone-identity/adapters/portone.adapter';

import { PhoneIdentityService } from './phone-identity.service';

@Global()
@Module({
  providers: [PortOneAdapter, PhoneIdentityService],
  exports: [PhoneIdentityService],
})
export class PhoneIdentityModule {}
