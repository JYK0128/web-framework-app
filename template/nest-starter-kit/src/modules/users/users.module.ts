import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { User } from '#/entities/auth/user.entity';

import { UsersController } from './users.controller';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [UsersController],
})
export class UsersModule {}
