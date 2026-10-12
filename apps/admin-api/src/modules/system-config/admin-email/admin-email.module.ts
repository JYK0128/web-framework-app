import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigAdminEmailController } from './admin-email.controller';
import { CheckAdminEmailConfigHandler } from './check-admin-email-config.handler';
import { GetAdminSmtpConfigHandler } from './get-admin-smtp-config.handler';
import { TestAdminEmailHandler } from './test-admin-email.handler';

@Module({
  imports: [CqrsModule],
  controllers: [SystemConfigAdminEmailController],
  providers: [GetAdminSmtpConfigHandler, CheckAdminEmailConfigHandler, TestAdminEmailHandler],
})
export class SystemConfigAdminEmailModule {}
