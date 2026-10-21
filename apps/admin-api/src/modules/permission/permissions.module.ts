import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetPermissionsHandler } from '~/modules/permission/get-permissions.handler';
import { PermissionsController } from '~/modules/permission/permissions.controller';

@Module({
  imports: [CqrsModule],
  controllers: [PermissionsController],
  providers: [GetPermissionsHandler],
})
export class PermissionsModule {}
