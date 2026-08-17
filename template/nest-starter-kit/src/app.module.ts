import { EntityManager } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { uuid } from '@pkg/shared/common';
import type { Request } from 'express';
import { ClsModule } from 'nestjs-cls';

import { REQUEST_RATE_LIMIT_MAX_REQUESTS, REQUEST_RATE_LIMIT_TTL_MS } from '#/common/constants/app.constants';
import { ApplicationErrorFilter } from '#/common/filters/application-error.filter';
import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '#/common/filters/unexpected-exception.filter';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { UnitOfWorkInterceptor } from '#/common/interceptors/unit-of-work.interceptor';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { RedisModule } from '#/common/redis/redis.module';
import { SecurityModule } from '#/common/security/security.module';
import { DatabaseInitializer } from '#/database/database.initializer';
import { AppEntityManager } from '#/database/entity-manager';
import mikroOrmConfig from '#/database/mikro-orm.config';
import { AuditSubscriber } from '#/database/subscribers/audit.subscriber';
import { ActivityLogsModule } from '#/modules/activity-logs/activity-logs.module';
import { AuthModule } from '#/modules/auth/auth.module';
import { FaqsModule } from '#/modules/faqs/faqs.module';
import { HealthModule } from '#/modules/health/health.module';
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
        setup: (cls, request: Request) => {
          const requestId = request.header('x-request-id')?.trim() || uuid();
          cls.set('requestId', requestId);
          cls.set('user', null);
          cls.set('authLevel', null);
          cls.set('impersonatedBy', null);
          cls.set('tokenJti', null);
          cls.set('tokenExp', null);
          cls.set('clientContext', {
            ipAddress: request.ip || request.header('x-forwarded-for')?.split(',')[0]?.trim() || null,
            userAgent: request.header('user-agent') || null,
            referer: request.header('referer') || request.header('referrer') || null,
            origin: request.header('origin') || null,
            acceptLanguage: request.header('accept-language') || null,
            secChUa: request.header('sec-ch-ua') || null,
            secChUaMobile: request.header('sec-ch-ua-mobile') || null,
            secChUaPlatform: request.header('sec-ch-ua-platform') || null,
            doNotTrack: request.header('dnt') || null,
          });
        },
      },
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    ThrottlerModule.forRoot([{
      ttl: REQUEST_RATE_LIMIT_TTL_MS,
      limit: REQUEST_RATE_LIMIT_MAX_REQUESTS,
    }]),
    RedisModule,
    SecurityModule,
    AuthModule,
    OnboardingModule,
    FaqsModule,
    HealthModule,
    RolesModule,
    NoticesModule,
    TermsModule,
    UsersModule,
    ActivityLogsModule,
  ],
  providers: [
    DatabaseInitializer,
    AuditSubscriber,
    RequestLoggingMiddleware,
    {
      provide: AppEntityManager,
      useExisting: EntityManager,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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
      .apply(RequestLoggingMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
