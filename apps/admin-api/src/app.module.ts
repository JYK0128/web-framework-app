import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { RequestContextMiddleware } from '@pkg/server-core/http/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '@pkg/server-core/http/middlewares/request-logging.middleware';

import { CoreModule } from '#/core/core.module';
import { DomainModule } from '#/modules/domain.module';

@Module({
  imports: [
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
