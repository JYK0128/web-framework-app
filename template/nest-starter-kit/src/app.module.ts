import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';

import { CoreModule } from '#/common/core.module';
import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { RequestContextMiddleware } from '#/common/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { InfraModule } from '#/infra/infra.module';
import { DomainModule } from '#/modules/domain.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    DomainModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, ExpressSessionMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
