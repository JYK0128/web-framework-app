import { Module } from '@nestjs/common';

import { AlertsModule } from '#/modules/alerts/alerts.module';
import { AuthModule } from '#/modules/auth/auth.module';
import { CustomersModule } from '#/modules/customers/customers.module';
import { EventsModule } from '#/modules/events/events.module';
import { FaqsModule } from '#/modules/faqs/faqs.module';
import { HealthModule } from '#/modules/health/health.module';
import { LogsModule } from '#/modules/logs/logs.module';
import { MembershipsModule } from '#/modules/memberships/memberships.module';
import { NoticesModule } from '#/modules/notices/notices.module';
import { OperatorsModule } from '#/modules/operators/operators.module';
import { PermissionsModule } from '#/modules/permissions/permissions.module';
import { QnaModule } from '#/modules/qna/qna.module';
import { RolesModule } from '#/modules/roles/roles.module';
import { ServiceConfigModule } from '#/modules/service-config/service-config.module';
import { ServiceTermsModule } from '#/modules/service-terms/service-terms.module';
import { SupportModule } from '#/modules/support/support.module';
import { SystemConfigModule } from '#/modules/system-config/system-config.module';
import { TermsModule } from '#/modules/terms/terms.module';

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
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
