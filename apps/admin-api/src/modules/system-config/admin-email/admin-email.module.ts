import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigAdminEmailController } from '~/modules/system-config/admin-email/admin-email.controller';
import { CheckAdminEmailConfigHandler } from '~/modules/system-config/admin-email/check-admin-email-config.handler';
import { GetAdminSmtpConfigHandler } from '~/modules/system-config/admin-email/get-admin-smtp-config.handler';
import { TestAdminEmailHandler } from '~/modules/system-config/admin-email/test-admin-email.handler';

@Module({
  imports: [CqrsModule],
  controllers: [SystemConfigAdminEmailController],
  providers: [GetAdminSmtpConfigHandler, CheckAdminEmailConfigHandler, TestAdminEmailHandler],
})
export class SystemConfigAdminEmailModule {}
