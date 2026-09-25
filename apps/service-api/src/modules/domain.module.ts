import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { FaqsModule } from './faqs/faqs.module';
import { HealthModule } from './health/health.module';
import { InternalModule } from './internal/internal.module';
import { QnaModule } from './qna/qna.module';
import { SupportModule } from './support/support.module';
import { ServiceTermsModule } from './service-terms/service-terms.module';
import { SystemConfigsModule } from './system-configs/system-configs.module';

const DOMAIN_MODULES = [
  AuthModule,
  CustomersModule,
  HealthModule,
  InternalModule,
  SystemConfigsModule,
  FaqsModule,
  ServiceTermsModule,
  QnaModule,
  SupportModule,
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
