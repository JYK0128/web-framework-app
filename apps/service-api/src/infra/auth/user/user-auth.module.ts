import { type DynamicModule, Module, type Type } from '@nestjs/common';

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
import { type IUserAuthService, USER_AUTH_DRIVER, USER_AUTH_SERVICE, type UserAuthModuleOptions } from './user-auth.interface';

@Module({})
export class UserAuthModule {
  static forRoot(options: UserAuthModuleOptions): DynamicModule {
    const selectedService: Type<IUserAuthService> = options.driver === 'jwt'
      ? JwtUserAuthService
      : SessionUserAuthService;
    const tokenStore = options.driver === 'jwt' && options.tokenStore === 'database' ? DatabaseTokenStore : RedisTokenStore;
    const sessionStore = options.driver === 'session' && options.sessionStore === 'redis' ? RedisSessionStore : DatabaseSessionStore;

    return {
      module: UserAuthModule,
      global: true,
      providers: [
        selectedService,
        ...(options.driver === 'jwt' ? [tokenStore, { provide: TOKEN_STORE, useExisting: tokenStore }] : []),
        ...(options.driver === 'session'
          ? [
            SessionService,
            sessionStore,
            { provide: SESSION_STORE, useExisting: sessionStore },
            ExpressSessionMiddleware,
          ]
          : []),
        {
          provide: USER_AUTH_SERVICE,
          useExisting: selectedService,
        },
        {
          provide: USER_AUTH_DRIVER,
          useValue: options.driver,
        },
      ],
      exports: [USER_AUTH_DRIVER, USER_AUTH_SERVICE, ...(options.driver === 'jwt' ? [TOKEN_STORE] : []), ...(options.driver === 'session' ? [ExpressSessionMiddleware] : [])],
    };
  }
}
