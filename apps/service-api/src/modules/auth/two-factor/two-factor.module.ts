import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DisableTwoFactorHandler } from '#/modules/auth/two-factor/disable-two-factor.handler';
import { EnableTwoFactorHandler } from '#/modules/auth/two-factor/enable-two-factor.handler';
import { GenerateTwoFactorHandler } from '#/modules/auth/two-factor/generate-two-factor.handler';
import { AuthTwoFactorController } from '#/modules/auth/two-factor/two-factor.controller';
import { TwoFactorLoginHandler } from '#/modules/auth/two-factor/two-factor-login.handler';

@Module({
  controllers: [AuthTwoFactorController],
  imports: [CqrsModule],
  providers: [DisableTwoFactorHandler, EnableTwoFactorHandler, GenerateTwoFactorHandler, TwoFactorLoginHandler],
})
export class AuthTwoFactorModule {}
