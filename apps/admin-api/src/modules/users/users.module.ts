import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { BanUserHandler, CreateUserHandler, DeleteUserHandler, GetUserByIdHandler, GetUserOverviewHandler, GetUsersHandler, ResetUserTwoFactorHandler, RestoreUserHandler, UnbanUserHandler, UpdateUserRoleHandler } from './handlers';
import { UsersController } from './users.controller';

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [GetUserByIdHandler, GetUserOverviewHandler, GetUsersHandler, CreateUserHandler, BanUserHandler, UnbanUserHandler, DeleteUserHandler, RestoreUserHandler, UpdateUserRoleHandler, ResetUserTwoFactorHandler],
})
export class UsersModule {}
