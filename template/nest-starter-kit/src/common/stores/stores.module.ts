import { Global, Module } from '@nestjs/common';

import { SessionStore } from './session.store';
import { VerificationStore } from './verification.store';

@Global()
@Module({
  providers: [SessionStore, VerificationStore],
  exports: [SessionStore, VerificationStore],
})
export class StoresModule {}
