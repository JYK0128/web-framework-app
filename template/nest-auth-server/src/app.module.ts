import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HttpExceptionFilter } from '#/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '#/common/interceptors/response-transform.interceptor';
import { UnitOfWorkInterceptor } from '#/common/interceptors/unit-of-work.interceptor';
import { RequestContextMiddleware } from '#/common/middleware/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middleware/request-logging.middleware';
import { DatabaseInitializer } from '#/database/database.initializer';
import mikroOrmConfig from '#/database/mikro-orm.config';
import { AuthModule } from '#/modules/auth/auth.module';
import { HealthModule } from '#/modules/health/health.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    HealthModule,
  ],
  providers: [
    DatabaseInitializer,
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
      .apply(RequestContextMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
