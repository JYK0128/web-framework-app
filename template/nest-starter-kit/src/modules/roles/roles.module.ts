import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetRolesHandler, UpdateRolePermissionsHandler } from './handlers';
import { RolesController } from './roles.controller';

const Handlers = [
  GetRolesHandler,
  UpdateRolePermissionsHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [RolesController],
  providers: [...Handlers],
})
export class RolesModule {}
