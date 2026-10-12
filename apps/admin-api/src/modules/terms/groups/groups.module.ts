import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermGroupHandler } from './create-term-group.handler';
import { DeleteTermGroupHandler } from './delete-term-group.handler';
import { GetTermGroupsHandler } from './get-term-groups.handler';
import { TermGroupsController } from './groups.controller';
import { UpdateTermGroupHandler } from './update-term-group.handler';

@Module({ imports: [CqrsModule], controllers: [TermGroupsController], providers: [CreateTermGroupHandler, DeleteTermGroupHandler, GetTermGroupsHandler, UpdateTermGroupHandler] })
export class TermGroupsModule {}
