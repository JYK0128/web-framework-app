import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';

import { CoreModule } from '#/common/core.module';
import { RequestContextMiddleware } from '#/common/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { env } from '#/env';
import { DatabaseModule } from '#/infra/database/database.module';
import { KvStoreModule } from '#/infra/kv-store/kv-store.module';
import { DomainModule } from '#/modules/domain.module';

@Module({
  imports: [
    DatabaseModule,
    KvStoreModule.forRoot({
      driver: 'redis',
      redis: { url: env.REDIS_URL },
    }),
    CoreModule,
    DomainModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
