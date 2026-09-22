import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { InternalModule } from './internal/internal.module';
import { SystemConfigsModule } from './system-configs/system-configs.module';

const DOMAIN_MODULES = [
  AuthModule,
  CustomersModule,
  HealthModule,
  InternalModule,
  SystemConfigsModule,
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
