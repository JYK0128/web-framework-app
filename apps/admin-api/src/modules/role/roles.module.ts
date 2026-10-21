import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateRoleHandler } from '~/modules/role/create-role.handler';
import { DeleteRoleHandler } from '~/modules/role/delete-role.handler';
import { GetRolesHandler } from '~/modules/role/get-roles.handler';
import { RolesController } from '~/modules/role/roles.controller';
import { UpdateRoleHandler } from '~/modules/role/update-role.handler';

@Module({
  imports: [CqrsModule],
  controllers: [RolesController],
  providers: [GetRolesHandler, CreateRoleHandler, UpdateRoleHandler, DeleteRoleHandler],
})
export class RolesModule {}
