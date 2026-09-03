import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetResourcesHandler } from './handlers';
import { ResourcesController } from './resources.controller';

const Handlers = [GetResourcesHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ResourcesController],
  providers: [...Handlers],
  exports: [...Handlers],
})
export class ResourcesModule {}
