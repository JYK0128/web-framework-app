import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SYSTEM_CONFIG_HANDLERS } from './handlers';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

@Global()
@Module({
  imports: [CqrsModule],
  controllers: [SystemConfigController],
  providers: [
    SystemConfigService,
    ...SYSTEM_CONFIG_HANDLERS,
  ],
  exports: [CqrsModule, SystemConfigService],
})
export class SystemConfigModule {}
