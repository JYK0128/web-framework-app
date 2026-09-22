import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { InternalModule } from './internal/internal.module';
import { LogsModule } from './logs/logs.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { TermsModule } from './terms/terms.module';
import { UsersModule } from './users/users.module';

const DOMAIN_MODULES = [
  AuthModule,
  HealthModule,
  InternalModule,
  CustomersModule,
  TermsModule,
  UsersModule,
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
