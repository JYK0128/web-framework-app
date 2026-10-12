import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigController } from './system-config.controller';
import { SYSTEM_CONFIG_HANDLERS } from './system-config.handlers';

@Module({ imports: [CqrsModule], controllers: [SystemConfigController], providers: [...SYSTEM_CONFIG_HANDLERS] })
export class SystemConfigModule {}
