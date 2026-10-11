import { Inject, MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';

import { ExpressSessionMiddleware } from '#/core/auth/user/adapters/session/express-session.middleware';
import { USER_AUTH_DRIVER, type UserAuthDriver } from '#/core/auth/user/user-auth.interface';
import { CoreModule } from '#/core/core.module';
import { RequestContextMiddleware } from '#/core/http/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/core/http/middlewares/request-logging.middleware';
import { DomainModule } from '#/modules/domain.module';

@Module({
  imports: [
    CoreModule,
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
