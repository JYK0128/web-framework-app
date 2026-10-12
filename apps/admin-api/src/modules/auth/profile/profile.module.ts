import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { MeHandler } from './me.handler';
import { AuthProfileController } from './profile.controller';

@Module({
  controllers: [AuthProfileController],
  imports: [CqrsModule],
  providers: [MeHandler],
})
export class AuthProfileModule {}
