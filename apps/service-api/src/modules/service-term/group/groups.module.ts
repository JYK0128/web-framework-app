import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateInternalServiceTermGroupHandler } from '#/modules/service-term/group/create-internal-service-term-group.handler';
import { DeleteInternalServiceTermGroupHandler } from '#/modules/service-term/group/delete-internal-service-term-group.handler';
import { GetInternalServiceTermGroupsHandler } from '#/modules/service-term/group/get-internal-service-term-groups.handler';
import { InternalServiceTermGroupsController } from '#/modules/service-term/group/groups-internal.controller';
import { UpdateInternalServiceTermGroupHandler } from '#/modules/service-term/group/update-internal-service-term-group.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalServiceTermGroupsController],
  providers: [GetInternalServiceTermGroupsHandler, CreateInternalServiceTermGroupHandler, UpdateInternalServiceTermGroupHandler, DeleteInternalServiceTermGroupHandler],
})
export class ServiceTermGroupsModule {}
