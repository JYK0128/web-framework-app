import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateInternalServiceTermGroupHandler } from '#/modules/service-terms/groups/create-internal-service-term-group.handler';
import { DeleteInternalServiceTermGroupHandler } from '#/modules/service-terms/groups/delete-internal-service-term-group.handler';
import { GetInternalServiceTermGroupsHandler } from '#/modules/service-terms/groups/get-internal-service-term-groups.handler';
import { InternalServiceTermGroupsController } from '#/modules/service-terms/groups/groups-internal.controller';
import { UpdateInternalServiceTermGroupHandler } from '#/modules/service-terms/groups/update-internal-service-term-group.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalServiceTermGroupsController],
  providers: [GetInternalServiceTermGroupsHandler, CreateInternalServiceTermGroupHandler, UpdateInternalServiceTermGroupHandler, DeleteInternalServiceTermGroupHandler],
})
export class ServiceTermGroupsModule {}
