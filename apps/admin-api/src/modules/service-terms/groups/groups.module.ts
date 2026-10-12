import { Module } from '@nestjs/common';

import { ServiceTermGroupsController } from './groups.controller';

@Module({ controllers: [ServiceTermGroupsController] })
export class ServiceTermGroupsModule {}
