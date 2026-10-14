import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermGroupHandler } from '#/modules/terms/groups/create-term-group.handler';
import { DeleteTermGroupHandler } from '#/modules/terms/groups/delete-term-group.handler';
import { GetTermGroupsHandler } from '#/modules/terms/groups/get-term-groups.handler';
import { TermGroupsController } from '#/modules/terms/groups/groups.controller';
import { UpdateTermGroupHandler } from '#/modules/terms/groups/update-term-group.handler';

@Module({ imports: [CqrsModule], controllers: [TermGroupsController], providers: [CreateTermGroupHandler, DeleteTermGroupHandler, GetTermGroupsHandler, UpdateTermGroupHandler] })
export class TermGroupsModule {}
