import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SYSTEM_CONFIG_HANDLERS } from './handlers';
import { SystemConfigTabUpdateService } from './services/system-config-tab-update.service';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

@Global()
@Module({
  imports: [CqrsModule],
  controllers: [SystemConfigController],
  providers: [
    SystemConfigService,
    SystemConfigTabUpdateService,
    ...SYSTEM_CONFIG_HANDLERS,
  ],
  exports: [CqrsModule, SystemConfigService],
})
export class SystemConfigModule {}
