import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetPermissionsHandler } from '#/modules/permissions/get-permissions.handler';
import { PermissionsController } from '#/modules/permissions/permissions.controller';

@Module({
  imports: [CqrsModule],
  controllers: [PermissionsController],
  providers: [GetPermissionsHandler],
})
export class PermissionsModule {}
