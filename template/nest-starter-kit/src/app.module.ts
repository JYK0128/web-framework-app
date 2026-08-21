import { EntityManager } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';

import { REQUEST_RATE_LIMIT_MAX_REQUESTS, REQUEST_RATE_LIMIT_TTL_MS } from '#/common/constants/app.constants';
import { ContextModule } from '#/common/contexts/context.module';
import { ApplicationErrorFilter } from '#/common/filters/application-error.filter';
import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '#/common/filters/unexpected-exception.filter';
import { AuthGuard } from '#/common/guards/auth.guard';
import { EmailVerificationGuard } from '#/common/guards/email-verification.guard';
import { PermissionGuard } from '#/common/guards/permission.guard';
import { PhoneVerificationGuard } from '#/common/guards/phone-verification.guard';
import { TermsAgreementGuard } from '#/common/guards/terms-agreement.guard';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { UnitOfWorkInterceptor } from '#/common/interceptors/unit-of-work.interceptor';
import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { RequestContextMiddleware } from '#/common/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { EmailModule } from '#/common/services/email/email.module';
import { FirebaseModule } from '#/common/services/firebase/firebase.module';
import { LoggerModule } from '#/common/services/logger/logger.module';
import { LokiModule } from '#/common/services/loki/loki.module';
import { OAuthModule } from '#/common/services/oauth/oauth.module';
import { RedisModule } from '#/common/services/redis/redis.module';
import { SlackModule } from '#/common/services/slack/slack.module';
import { StoresModule } from '#/common/stores/stores.module';
import { DatabaseInitializer } from '#/database/database.initializer';
import { AppEntityManager } from '#/database/entity-manager';
import mikroOrmConfig from '#/database/mikro-orm.config';
import { AuditSubscriber } from '#/database/subscribers/audit.subscriber';
import { ActivityLogsModule } from '#/modules/activity-logs/activity-logs.module';
import { AlertsModule } from '#/modules/alerts/alerts.module';
import { AuthModule } from '#/modules/auth/auth.module';
import { FaqsModule } from '#/modules/faqs/faqs.module';
import { HealthModule } from '#/modules/health/health.module';
import { InquiriesModule } from '#/modules/inquiries/inquiries.module';
import { NoticesModule } from '#/modules/notices/notices.module';
import { OnboardingModule } from '#/modules/onboarding/onboarding.module';
import { RolesModule } from '#/modules/roles/roles.module';
import { TermsModule } from '#/modules/terms/terms.module';
import { UsersModule } from '#/modules/users/users.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        saveReq: true,
        saveRes: true,
      },
    }),
    ContextModule,
    MikroOrmModule.forRoot(mikroOrmConfig),
    ThrottlerModule.forRoot([{
      ttl: REQUEST_RATE_LIMIT_TTL_MS,
      limit: REQUEST_RATE_LIMIT_MAX_REQUESTS,
    }]),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot(),
    RedisModule.forRoot(),
    LokiModule.forRoot(),
    OAuthModule.forRoot(),
    SlackModule.forRoot(),
    EmailModule.forRoot(),
    FirebaseModule,
    StoresModule,
    AuthModule,
    OnboardingModule,
    FaqsModule,
    InquiriesModule,
    HealthModule,
    RolesModule,
    NoticesModule,
    TermsModule,
    UsersModule,
    ActivityLogsModule,
    AlertsModule,
  ],
  providers: [
    DatabaseInitializer,
    AuditSubscriber,
    RequestContextMiddleware,
    ExpressSessionMiddleware,
    RequestLoggingMiddleware,
    {
      provide: AppEntityManager,
      useExisting: EntityManager,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EmailVerificationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TermsAgreementGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PhoneVerificationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    // Nest applies APP_FILTER providers in reverse order.
    // Declare the catch-all first so specific filters handle their own exceptions first.
    {
      provide: APP_FILTER,
      useClass: UnexpectedExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ApplicationErrorFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UnitOfWorkInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, ExpressSessionMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
