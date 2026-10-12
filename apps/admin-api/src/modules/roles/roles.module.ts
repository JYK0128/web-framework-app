import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateRoleHandler } from './create-role.handler';
import { DeleteRoleHandler } from './delete-role.handler';
import { GetRolesHandler } from './get-roles.handler';
import { RolesController } from './roles.controller';
import { UpdateRoleHandler } from './update-role.handler';

@Module({
  imports: [CqrsModule],
  controllers: [RolesController],
  providers: [GetRolesHandler, CreateRoleHandler, UpdateRoleHandler, DeleteRoleHandler],
})
export class RolesModule {}
