import { Module } from '@nestjs/common';

import { MachineTokenService } from './machine-token.service';

@Module({
  providers: [MachineTokenService],
  exports: [MachineTokenService],
})
export class MachineModule {}
