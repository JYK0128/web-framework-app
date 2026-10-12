import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetPermissionsHandler } from './get-permissions.handler';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [CqrsModule],
  controllers: [PermissionsController],
  providers: [GetPermissionsHandler],
})
export class PermissionsModule {}
