import { Module } from '@nestjs/common';

import { InternalServiceClient } from './machine-service-client.service';
import { MachineTokenService } from './machine-token.service';

@Module({
  providers: [MachineTokenService, InternalServiceClient],
  exports: [MachineTokenService, InternalServiceClient],
})
export class MachineModule {}
