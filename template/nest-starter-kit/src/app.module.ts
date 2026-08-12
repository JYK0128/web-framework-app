import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { uuid } from '@pkg/shared/common';
import cookieParser from 'cookie-parser';
import type { Request } from 'express';
import { ClsModule } from 'nestjs-cls';

import { REQUEST_RATE_LIMIT_MAX_REQUESTS, REQUEST_RATE_LIMIT_TTL_MS } from '#/common/constants/app.constants';
import { ApplicationErrorFilter } from '#/common/filters/application-error.filter';
import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { UnexpectedExceptionFilter } from '#/common/filters/unexpected-exception.filter';
import { PermissionGuard } from '#/common/guards/permission.guard';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { UnitOfWorkInterceptor } from '#/common/interceptors/unit-of-work.interceptor';
import { CsrfMiddleware } from '#/common/middlewares/csrf.middleware';
import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { SessionModule } from '#/common/security/session.module';
import { DatabaseInitializer } from '#/database/database.initializer';
import mikroOrmConfig from '#/database/mikro-orm.config';
import { AuditSubscriber } from '#/database/subscribers/audit.subscriber';
import { env } from '#/env';
import { AuthModule } from '#/modules/auth/auth.module';
import { HealthModule } from '#/modules/health/health.module';
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
          cls.set('sessionId', null);
          cls.set('oauthState', null);
          cls.set('user', null);
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
    SessionModule,
    ThrottlerModule.forRoot([{
      ttl: REQUEST_RATE_LIMIT_TTL_MS,
      limit: REQUEST_RATE_LIMIT_MAX_REQUESTS,
    }]),
    AuthModule,
    HealthModule,
    RolesModule,
    TermsModule,
    UsersModule,
  ],
  providers: [
    DatabaseInitializer,
    AuditSubscriber,
    ExpressSessionMiddleware,
    CsrfMiddleware,
    RequestLoggingMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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
      .apply(
        cookieParser(env.APP_SECRET),
        ExpressSessionMiddleware,
        RequestLoggingMiddleware,
        CsrfMiddleware,
      )
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
