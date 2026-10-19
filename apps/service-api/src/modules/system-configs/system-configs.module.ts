import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { InternalSystemConfigsController } from './internal-system-configs.controller';
import { SystemContext } from './system.context';
import { SystemConfigService } from './system-config.service';
import { SystemConfigsController } from './system-configs.controller';
import { SystemMaintenanceGuard } from './system-maintenance.guard';

@Module({
  controllers: [SystemConfigsController, InternalSystemConfigsController],
  providers: [
    SystemContext,
    SystemConfigService,
    { provide: APP_GUARD, useClass: SystemMaintenanceGuard },
  ],
  exports: [SystemContext],
})
export class SystemConfigsModule {}
