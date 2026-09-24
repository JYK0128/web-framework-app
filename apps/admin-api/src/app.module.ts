import { Inject, MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';

import { CoreModule } from '#/common/core.module';
import { RequestContextMiddleware } from '#/common/middlewares/request-context.middleware';
import { RequestLoggingMiddleware } from '#/common/middlewares/request-logging.middleware';
import { env } from '#/env';
import { MachineModule } from '#/infra/auth/machine/machine.module';
import { ExpressSessionMiddleware } from '#/infra/auth/user/session/express-session.middleware';
import { USER_AUTH_DRIVER, type UserAuthDriver } from '#/infra/auth/user/user-auth.interface';
import { UserAuthModule } from '#/infra/auth/user/user-auth.module';
import { DatabaseModule } from '#/infra/database/database.module';
import { KvStoreModule } from '#/infra/kv-store/kv-store.module';
import { NotificationModule } from '#/infra/notification/notification.module';
import { StorageModule } from '#/infra/storage/storage.module';
import { DomainModule } from '#/modules/domain.module';
import { MembershipsModule } from '#/modules/memberships/memberships.module';

@Module({
  imports: [
    DatabaseModule,
    KvStoreModule.forRoot({
      driver: 'redis',
      redis: { url: env.REDIS_URL },
    }),
    UserAuthModule.forRoot({
      driver: 'jwt',
      tokenStore: 'redis',
    }),
    MachineModule.forRoot({ driver: 'jwt' }),
    CoreModule,
    NotificationModule,
    StorageModule.forRoot(),
    DomainModule,
    MembershipsModule,
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
