import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateRoleHandler } from '#/modules/roles/create-role.handler';
import { DeleteRoleHandler } from '#/modules/roles/delete-role.handler';
import { GetRolesHandler } from '#/modules/roles/get-roles.handler';
import { RolesController } from '#/modules/roles/roles.controller';
import { UpdateRoleHandler } from '#/modules/roles/update-role.handler';

@Module({
  imports: [CqrsModule],
  controllers: [RolesController],
  providers: [GetRolesHandler, CreateRoleHandler, UpdateRoleHandler, DeleteRoleHandler],
})
export class RolesModule {}
