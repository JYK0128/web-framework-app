import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { FaqsModule } from './faqs/faqs.module';
import { ServiceTermsModule } from './service-terms/service-terms.module';
import { InternalModule } from './internal/internal.module';
import { LogsModule } from './logs/logs.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { TermsModule } from './terms/terms.module';
import { UsersModule } from './users/users.module';
import { QnaModule } from './qna/qna.module';

const DOMAIN_MODULES = [
  AuthModule,
  HealthModule,
  InternalModule,
  CustomersModule,
  FaqsModule,
  ServiceTermsModule,
  TermsModule,
  UsersModule,
  QnaModule,
  RolesModule,
  PermissionsModule,
  LogsModule,
  SystemConfigModule,
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
