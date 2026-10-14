import { Module } from '@nestjs/common';

import { AuthModule } from '#/modules/auth/auth.module';
import { CustomersModule } from '#/modules/customers/customers.module';
import { EventsModule } from '#/modules/events/events.module';
import { FaqsModule } from '#/modules/faqs/faqs.module';
import { HealthModule } from '#/modules/health/health.module';
import { MembershipsModule } from '#/modules/memberships/memberships.module';
import { NoticesModule } from '#/modules/notices/notices.module';
import { NotificationsModule } from '#/modules/notifications/notifications.module';
import { QnaModule } from '#/modules/qna/qna.module';
import { ServiceTermsModule } from '#/modules/service-terms/service-terms.module';
import { SupportModule } from '#/modules/support/support.module';
import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

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
