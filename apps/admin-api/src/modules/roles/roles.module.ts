import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateRoleHandler, DeleteRoleHandler, GetRolesHandler, UpdateRoleHandler } from './handlers';
import { RolesController } from './roles.controller';

@Module({
  imports: [CqrsModule],
  controllers: [RolesController],
  providers: [GetRolesHandler, CreateRoleHandler, UpdateRoleHandler, DeleteRoleHandler],
})
export class RolesModule {}
