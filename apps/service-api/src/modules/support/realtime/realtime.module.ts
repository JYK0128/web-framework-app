import { Module } from '@nestjs/common';

import { SupportGateway } from '#/modules/support/realtime/support.gateway';

@Module({
  providers: [SupportGateway],
})
export class SupportRealtimeModule {}
