import { Module } from '@nestjs/common';

import { AuthModule } from '~/modules/auth/auth.module';
import { CustomersModule } from '~/modules/customer/customers.module';
import { EventsModule } from '~/modules/event/events.module';
import { FaqsModule } from '~/modules/faq/faqs.module';
import { HealthModule } from '~/modules/health/health.module';
import { MembershipsModule } from '~/modules/membership/memberships.module';
import { NoticesModule } from '~/modules/notice/notices.module';
import { NotificationsModule } from '~/modules/notification/notifications.module';
import { QnaModule } from '~/modules/qna/qna.module';
import { ServiceTermsModule } from '~/modules/service-term/service-terms.module';
import { SupportModule } from '~/modules/support/support.module';
import { SystemConfigsModule } from '~/modules/system-config/system-configs.module';

const DOMAIN_MODULES = [
  AuthModule,
  MembershipsModule,
  CustomersModule,
  HealthModule,
  SystemConfigsModule,
  FaqsModule,
  ServiceTermsModule,
  QnaModule,
  SupportModule,
  NoticesModule,
  NotificationsModule,
  EventsModule,
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
