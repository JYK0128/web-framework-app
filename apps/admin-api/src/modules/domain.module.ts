import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { FaqsModule } from './faqs/faqs.module';
import { HealthModule } from './health/health.module';
import { LogsModule } from './logs/logs.module';
import { OperatorsModule } from './operators/operators.module';
import { PermissionsModule } from './permissions/permissions.module';
import { QnaModule } from './qna/qna.module';
import { RolesModule } from './roles/roles.module';
import { ServiceTermsModule } from './service-terms/service-terms.module';
import { SupportModule } from './support/support.module';
import { SystemConfigsModule } from './system-configs/system-configs.module';
import { TermsModule } from './terms/terms.module';

const DOMAIN_MODULES = [
  AuthModule,
  HealthModule,
  CustomersModule,
  FaqsModule,
  ServiceTermsModule,
  TermsModule,
  OperatorsModule,
  QnaModule,
  SupportModule,
  RolesModule,
  PermissionsModule,
  LogsModule,
  SystemConfigsModule,
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
