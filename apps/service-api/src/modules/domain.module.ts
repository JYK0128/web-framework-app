import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { InternalModule } from './internal/internal.module';
import { SystemConfigsModule } from './system-configs/system-configs.module';
import { FaqsModule } from './faqs/faqs.module';
import { ServiceTermsModule } from './service-terms/service-terms.module';

const DOMAIN_MODULES = [
  AuthModule,
  CustomersModule,
  HealthModule,
  InternalModule,
  SystemConfigsModule,
  FaqsModule,
  ServiceTermsModule,
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
