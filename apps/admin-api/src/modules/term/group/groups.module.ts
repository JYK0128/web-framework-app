import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermGroupHandler } from '#/modules/term/group/create-term-group.handler';
import { DeleteTermGroupHandler } from '#/modules/term/group/delete-term-group.handler';
import { GetTermGroupsHandler } from '#/modules/term/group/get-term-groups.handler';
import { TermGroupsController } from '#/modules/term/group/groups.controller';
import { UpdateTermGroupHandler } from '#/modules/term/group/update-term-group.handler';

@Module({ imports: [CqrsModule], controllers: [TermGroupsController], providers: [CreateTermGroupHandler, DeleteTermGroupHandler, GetTermGroupsHandler, UpdateTermGroupHandler] })
export class TermGroupsModule {}
