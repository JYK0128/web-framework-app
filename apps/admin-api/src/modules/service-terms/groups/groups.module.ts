import { Module } from '@nestjs/common';

import { ServiceTermGroupsController } from '#/modules/service-terms/groups/groups.controller';

@Module({ controllers: [ServiceTermGroupsController] })
export class ServiceTermGroupsModule {}
