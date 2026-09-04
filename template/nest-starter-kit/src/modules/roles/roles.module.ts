import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateRoleHandler, DeleteRoleHandler, GetRolesHandler, UpdateRolePermissionsHandler } from './handlers';
import { RolesController } from './roles.controller';

const Handlers = [
  GetRolesHandler,
  CreateRoleHandler,
  DeleteRoleHandler,
  UpdateRolePermissionsHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [RolesController],
  providers: [...Handlers],
})
export class RolesModule {}
