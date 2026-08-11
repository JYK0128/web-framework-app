import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SessionModule } from '#/common/security/session.module';

import { AdminController } from './admin.controller';
import { GetAdminOverviewHandler, GetAdminUsersHandler, GetServiceOverviewHandler, GetServiceUsersHandler, UpdateAdminUserStatusHandler, UpdateServiceUserStatusHandler } from './handlers';

const Handlers = [
  GetAdminOverviewHandler,
  GetAdminUsersHandler,
  UpdateAdminUserStatusHandler,
  GetServiceOverviewHandler,
  GetServiceUsersHandler,
  UpdateServiceUserStatusHandler,
];

@Module({
  imports: [CqrsModule, SessionModule],
  controllers: [AdminController],
  providers: [...Handlers],
})
export class AdminModule {}
