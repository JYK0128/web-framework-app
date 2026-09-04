import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateResourceHandler, DeleteResourceHandler, GetResourcesHandler, UpdateResourceHandler } from './handlers';
import { ResourcesController } from './resources.controller';

const Handlers = [CreateResourceHandler, DeleteResourceHandler, GetResourcesHandler, UpdateResourceHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ResourcesController],
  providers: [...Handlers],
  exports: [...Handlers],
})
export class ResourcesModule {}
