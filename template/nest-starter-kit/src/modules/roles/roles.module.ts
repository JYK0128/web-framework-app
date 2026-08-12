import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Role } from '#/entities/auth.extentions/role.entity';

import { RolesController } from './roles.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Role])],
  controllers: [RolesController],
})
export class RolesModule {}
