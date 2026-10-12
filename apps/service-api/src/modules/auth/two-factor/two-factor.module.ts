import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DisableTwoFactorHandler } from './disable-two-factor.handler';
import { EnableTwoFactorHandler } from './enable-two-factor.handler';
import { GenerateTwoFactorHandler } from './generate-two-factor.handler';
import { AuthTwoFactorController } from './two-factor.controller';
import { TwoFactorLoginHandler } from './two-factor-login.handler';

@Module({
  controllers: [AuthTwoFactorController],
  imports: [CqrsModule],
  providers: [DisableTwoFactorHandler, EnableTwoFactorHandler, GenerateTwoFactorHandler, TwoFactorLoginHandler],
})
export class AuthTwoFactorModule {}
