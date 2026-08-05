import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { uuid } from '@pkg/shared/common';
import type { Request } from 'express';
import { ClsModule } from 'nestjs-cls';

import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { UnitOfWorkInterceptor } from '#/common/interceptors/unit-of-work.interceptor';
import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { SessionModule } from '#/common/session/session.module';
import { DatabaseInitializer } from '#/database/database.initializer';
import mikroOrmConfig from '#/database/mikro-orm.config';
import { AuditSubscriber } from '#/database/subscribers/audit.subscriber';
import { AuthModule } from '#/modules/auth/auth.module';
import { HealthModule } from '#/modules/health/health.module';
import { TermsModule } from '#/modules/terms/terms.module';

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
          cls.set('user', null);
          cls.set('isTwoFactorAuthenticated', false);
          cls.set('tracking', {
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
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    HealthModule,
    TermsModule,
  ],
  providers: [
    DatabaseInitializer,
    AuditSubscriber,
    ExpressSessionMiddleware,
    RequestLoggingMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
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
      .apply(ExpressSessionMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
