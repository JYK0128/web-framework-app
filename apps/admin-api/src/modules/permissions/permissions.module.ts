import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetPermissionsHandler } from './handlers';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [CqrsModule],
  controllers: [PermissionsController],
  providers: [GetPermissionsHandler],
})
export class PermissionsModule {}
