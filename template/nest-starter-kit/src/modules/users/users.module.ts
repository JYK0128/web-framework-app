import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { AccessTokenService } from '#/common/security/access-token.service';
import { User } from '#/entities/auth/user.entity';

import { UsersController } from './users.controller';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [AccessTokenService],
})
export class UsersModule {}
