import { Module } from '@nestjs/common';

import { AlertsModule } from '#/modules/alert/alerts.module';
import { AuthModule } from '#/modules/auth/auth.module';
import { CustomersModule } from '#/modules/customer/customers.module';
import { EventsModule } from '#/modules/event/events.module';
import { FaqsModule } from '#/modules/faq/faqs.module';
import { HealthModule } from '#/modules/health/health.module';
import { LogsModule } from '#/modules/log/logs.module';
import { MembershipsModule } from '#/modules/membership/memberships.module';
import { NoticesModule } from '#/modules/notice/notices.module';
import { OperatorsModule } from '#/modules/operator/operators.module';
import { PermissionsModule } from '#/modules/permission/permissions.module';
import { QnaModule } from '#/modules/qna/qna.module';
import { RolesModule } from '#/modules/role/roles.module';
import { ServiceConfigModule } from '#/modules/service-config/service-config.module';
import { ServiceTermsModule } from '#/modules/service-term/service-terms.module';
import { SupportModule } from '#/modules/support/support.module';
import { SystemConfigModule } from '#/modules/system-config/system-config.module';
import { TermsModule } from '#/modules/term/terms.module';
import { WebhooksModule } from '#/modules/webhook/webhooks.module';

const DOMAIN_MODULES = [
  AuthModule,
  AlertsModule,
  HealthModule,
  CustomersModule,
  FaqsModule,
  NoticesModule,
  EventsModule,
  ServiceTermsModule,
  TermsModule,
  OperatorsModule,
  QnaModule,
  SupportModule,
  RolesModule,
  PermissionsModule,
  LogsModule,
  MembershipsModule,
  SystemConfigModule,
  ServiceConfigModule,
  WebhooksModule,
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
