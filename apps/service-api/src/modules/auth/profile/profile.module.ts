import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { MeHandler } from '~/modules/auth/profile/me.handler';
import { AuthProfileController } from '~/modules/auth/profile/profile.controller';

@Module({
  controllers: [AuthProfileController],
  imports: [CqrsModule],
  providers: [MeHandler],
})
export class AuthProfileModule {}
