import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from '#/core/core.module';
import { RequestContextMiddleware } from '#/core/http/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/core/http/middlewares/request-logging.middleware';
import { DomainModule } from '#/modules/domain.module';

@Module({
  imports: [
    CoreModule,
    ScheduleModule.forRoot(),
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
