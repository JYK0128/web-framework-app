import { Module } from '@nestjs/common';

import { MachineModule } from '#/infra/auth/machine/machine.module';

import { AdminConfigClient } from './admin-config.client';
import { SystemConfigsController } from './system-configs.controller';

@Module({
  imports: [MachineModule],
  controllers: [SystemConfigsController],
  providers: [AdminConfigClient],
  exports: [AdminConfigClient],
})
export class SystemConfigsModule {}
