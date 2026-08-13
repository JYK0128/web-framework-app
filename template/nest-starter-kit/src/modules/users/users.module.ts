import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { SessionModule } from '#/common/security/session.module';
import { User } from '#/entities/auth/user.entity';

import { UsersController } from './users.controller';

@Module({
  imports: [MikroOrmModule.forFeature([User]), SessionModule],
  controllers: [UsersController],
})
export class UsersModule {}
