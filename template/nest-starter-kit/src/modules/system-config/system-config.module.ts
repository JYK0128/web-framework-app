import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SYSTEM_CONFIG_HANDLERS } from './handlers';
import { SystemConfigController } from './system-config.controller';

@Global()
@Module({
  imports: [CqrsModule],
  controllers: [SystemConfigController],
  providers: [
    ...SYSTEM_CONFIG_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class SystemConfigModule {}
