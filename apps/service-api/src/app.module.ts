import { Inject, MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from '#/core/core.module';
import { RequestContextMiddleware } from '#/core/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/core/middlewares/request-logging.middleware';
import { ExpressSessionMiddleware } from '#/infra/auth/user/adapters/session/express-session.middleware';
import { USER_AUTH_DRIVER, type UserAuthDriver } from '#/infra/auth/user/user-auth.interface';
import { InfraModule } from '#/infra/infra.module';
import { DomainModule } from '#/modules/domain.module';

@Module({
  imports: [
    InfraModule,
    CoreModule,
    ScheduleModule.forRoot(),
    DomainModule,
  ],
})
export class AppModule implements NestModule {
  constructor(@Inject(USER_AUTH_DRIVER) private readonly userAuthDriver: UserAuthDriver) {}

  configure(consumer: MiddlewareConsumer): void {
    if (this.userAuthDriver === 'session') {
      consumer
        .apply(RequestContextMiddleware, ExpressSessionMiddleware, RequestLoggingMiddleware)
        .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
      return;
    }

    consumer
      .apply(RequestContextMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
