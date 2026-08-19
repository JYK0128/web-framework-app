import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { BanUserHandler, DeleteUserHandler, GetUserByIdHandler, GetUserOverviewHandler, GetUsersHandler, ResetUserPasswordHandler, ResetUserTwoFactorHandler, RestoreUserHandler, UnbanUserHandler, UpdateUserRoleHandler } from './handlers';
import { UsersController } from './users.controller';

const Handlers = [
  GetUsersHandler,
  GetUserOverviewHandler,
  GetUserByIdHandler,
  BanUserHandler,
  UnbanUserHandler,
  DeleteUserHandler,
  RestoreUserHandler,
  UpdateUserRoleHandler,
  ResetUserPasswordHandler,
  ResetUserTwoFactorHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [...Handlers],
})
export class UsersModule {}
