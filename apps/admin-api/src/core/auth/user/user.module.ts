import { type DynamicModule, HttpStatus, Inject, MiddlewareConsumer, Module, type NestModule, Optional, type Provider, RequestMethod, type Type } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';

import { ExpressSessionMiddleware } from '#/core/auth/user/session/middleware/express-session.middleware';
import { SESSION_MIDDLEWARE_TYPE, type SessionMiddlewareType } from '#/core/auth/user/session/middleware/session.middleware';
import { SessionService } from '#/core/auth/user/session/session.service';
import { createSessionStoreProviders } from '#/core/auth/user/session/stores/session.store';
import { DatabaseTokenStore } from '#/core/auth/user/token/stores/database-token.store';
import { RedisTokenStore } from '#/core/auth/user/token/stores/redis-token.store';
import { TOKEN_STORE } from '#/core/auth/user/token/stores/token.store';
import { UserJwtService } from '#/core/auth/user/token/user-jwt.service';
import { UserAuthGuard } from '#/core/auth/user/user-auth.guard';
import { type AuthStoreDriver, type IUserAuthService, USER_AUTH_SERVICE, type UserAuthModuleOptions } from '#/core/auth/user/user-auth.interface';

const USER_AUTH_DRIVER = Symbol('USER_AUTH_DRIVER');

const SESSION_MIDDLEWARES = {
  express: ExpressSessionMiddleware,
} satisfies Readonly<Record<string, SessionMiddlewareType>>;

@Module({})
export class UserAuthModule implements NestModule {
  constructor(
    @Inject(USER_AUTH_DRIVER) private readonly driver: UserAuthModuleOptions['driver'],
    @Optional() @Inject(SESSION_MIDDLEWARE_TYPE) private readonly sessionMiddleware?: SessionMiddlewareType,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    if (this.driver !== 'session') return;

    if (!this.sessionMiddleware) {
      throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }

    consumer
      .apply(this.sessionMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }

  static forRoot(options: UserAuthModuleOptions): DynamicModule {
    const selectedService: Type<IUserAuthService> = options.driver === 'jwt' ? UserJwtService : SessionService;
    const providers: DynamicModule['providers'] = [
      UserAuthGuard,
      selectedService,
      { provide: USER_AUTH_SERVICE, useExisting: selectedService },
      { provide: USER_AUTH_DRIVER, useValue: options.driver },
    ];
    const exports: DynamicModule['exports'] = [UserAuthGuard, USER_AUTH_SERVICE];

    if (options.driver === 'jwt') {
      const refreshTokenStore = selectStore(options.refreshTokenStore, DatabaseTokenStore, RedisTokenStore, 'redis');
      providers.push(refreshTokenStore, { provide: TOKEN_STORE, useExisting: refreshTokenStore });
      exports.push(TOKEN_STORE);
    }
    else {
      const sessionMiddlewareTypes = Object.values(SESSION_MIDDLEWARES);
      providers.push(
        ...createSessionStoreProviders(options.sessionStore),
        ...sessionMiddlewareTypes,
        createSessionMiddlewareProvider(SESSION_MIDDLEWARES),
      );
      exports.push(...sessionMiddlewareTypes);
    }

    return { module: UserAuthModule, global: true, providers, exports };
  }
}

function selectStore<TDatabase, TRedis>(driver: AuthStoreDriver | undefined, database: TDatabase, redis: TRedis, defaultDriver: AuthStoreDriver): TDatabase | TRedis {
  return (driver ?? defaultDriver) === 'redis' ? redis : database;
}

function createSessionMiddlewareProvider(middlewares: Readonly<Record<string, SessionMiddlewareType>>): Provider {
  return {
    provide: SESSION_MIDDLEWARE_TYPE,
    inject: [HttpAdapterHost],
    useFactory: (adapterHost: HttpAdapterHost): SessionMiddlewareType => {
      const platform = adapterHost.httpAdapter.getType();
      const middleware = middlewares[platform];
      if (middleware) return middleware;
      throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR, details: { platform } });
    },
  };
}
