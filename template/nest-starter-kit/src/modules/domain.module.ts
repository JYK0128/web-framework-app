import { Module } from '@nestjs/common';

import { AlertsModule } from '#/modules/alerts/alerts.module';
import { AuthModule } from '#/modules/auth/auth.module';
import { FaqsModule } from '#/modules/faqs/faqs.module';
import { HealthModule } from '#/modules/health/health.module';
import { InquiriesModule } from '#/modules/inquiries/inquiries.module';
import { LogManagementModule } from '#/modules/log-management/log-management.module';
import { MessageTemplatesModule } from '#/modules/message-templates/message-templates.module';
import { NoticesModule } from '#/modules/notices/notices.module';
import { OnboardingModule } from '#/modules/onboarding/onboarding.module';
import { ResourcesModule } from '#/modules/resources/resources.module';
import { RolesModule } from '#/modules/roles/roles.module';
import { SystemConfigModule } from '#/modules/system-config/system-config.module';
import { TermsModule } from '#/modules/terms/terms.module';
import { UsersModule } from '#/modules/users/users.module';

const DOMAIN_MODULES = [
  AuthModule,
  UsersModule,
  RolesModule,
  ResourcesModule,
  SystemConfigModule,
  MessageTemplatesModule,
  OnboardingModule,
  TermsModule,
  NoticesModule,
  FaqsModule,
  InquiriesModule,
  AlertsModule,
  LogManagementModule,
  HealthModule,
];

@Module({
  imports: DOMAIN_MODULES,
  exports: DOMAIN_MODULES,
})
export class DomainModule {}
