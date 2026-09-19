import { type DynamicModule, Module, type Provider, type Type } from '@nestjs/common';

import { DatabaseTokenStore } from './jwt/database-token.store';
import { JwtUserAuthService } from './jwt/jwt-user-auth.service';
import { RedisTokenStore } from './jwt/redis-token.store';
import { TOKEN_STORE } from './jwt/token.store';
import { DatabaseSessionStore } from './session/database-session.store';
import { ExpressSessionMiddleware } from './session/express-session.middleware';
import { RedisSessionStore } from './session/redis-session.store';
import { SessionService } from './session/session.service';
import { SESSION_STORE } from './session/session-store.interface';
import { SessionUserAuthService } from './session/session-user-auth.service';
import { type IUserAuthService, USER_AUTH_DRIVER, USER_AUTH_SERVICE, type UserAuthDriver, type UserAuthModuleOptions } from './user-auth.interface';

interface UserAuthDriverDefinition {
  service: Type<IUserAuthService>
  createProviders(options: UserAuthModuleOptions): Provider[]
  exports: Array<symbol | Type<unknown>>
}

const USER_AUTH_DRIVERS: Record<UserAuthDriver, UserAuthDriverDefinition> = {
  jwt: {
    service: JwtUserAuthService,
    createProviders: (options) => {
      const tokenStore = resolveTokenStore(options);
      return [
        tokenStore,
        { provide: TOKEN_STORE, useExisting: tokenStore },
      ];
    },
    exports: [TOKEN_STORE],
  },
  session: {
    service: SessionUserAuthService,
    createProviders: (options) => {
      const sessionStore = resolveSessionStore(options);
      return [
        SessionService,
        sessionStore,
        { provide: SESSION_STORE, useExisting: sessionStore },
        ExpressSessionMiddleware,
      ];
    },
    exports: [ExpressSessionMiddleware],
  },
};

function resolveTokenStore(options: UserAuthModuleOptions): Type<RedisTokenStore | DatabaseTokenStore> {
  return options.driver === 'jwt' && options.tokenStore === 'database' ? DatabaseTokenStore : RedisTokenStore;
}

function resolveSessionStore(options: UserAuthModuleOptions): Type<RedisSessionStore | DatabaseSessionStore> {
  return options.driver === 'session' && options.sessionStore === 'redis' ? RedisSessionStore : DatabaseSessionStore;
}

@Module({})
export class UserAuthModule {
  static forRoot(options: UserAuthModuleOptions): DynamicModule {
    const driver = USER_AUTH_DRIVERS[options.driver];

    return {
      module: UserAuthModule,
      global: true,
      providers: [
        driver.service,
        ...driver.createProviders(options),
        {
          provide: USER_AUTH_SERVICE,
          useExisting: driver.service,
        },
        {
          provide: USER_AUTH_DRIVER,
          useValue: options.driver,
        },
      ],
      exports: [USER_AUTH_DRIVER, USER_AUTH_SERVICE, ...driver.exports],
    };
  }
}
