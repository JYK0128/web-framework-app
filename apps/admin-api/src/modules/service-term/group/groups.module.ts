import { Module } from '@nestjs/common';

import { ServiceTermGroupsController } from '~/modules/service-term/group/groups.controller';

@Module({ controllers: [ServiceTermGroupsController] })
export class ServiceTermGroupsModule {}
