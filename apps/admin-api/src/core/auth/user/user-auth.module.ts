import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { DatabaseTokenStore } from '#/core/auth/user/adapters/jwt/database-token.store';
import { RedisTokenStore } from '#/core/auth/user/adapters/jwt/redis-token.store';
import { TOKEN_STORE } from '#/core/auth/user/adapters/jwt/token.store';
import { UserJwtAdapter } from '#/core/auth/user/adapters/jwt/user-jwt.adapter';
import { DatabaseSessionStore } from '#/core/auth/user/adapters/session/database-session.store';
import { ExpressSessionMiddleware } from '#/core/auth/user/adapters/session/express-session.middleware';
import { RedisSessionStore } from '#/core/auth/user/adapters/session/redis-session.store';
import { SessionService } from '#/core/auth/user/adapters/session/session.service';
import { SESSION_STORE } from '#/core/auth/user/adapters/session/session-store.interface';
import { UserAuthGuard } from '#/core/auth/user/user-auth.guard';

import { JwtUserAuthService } from './jwt-user-auth.service';
import { SessionUserAuthService } from './session-user-auth.service';
import { type IUserAuthService, USER_AUTH_DRIVER, USER_AUTH_SERVICE, type UserAuthModuleOptions } from './user-auth.interface';

@Module({})
export class UserAuthModule {
  static forRoot(options: UserAuthModuleOptions): DynamicModule {
    const selectedService: Type<IUserAuthService> = options.driver === 'jwt' ? JwtUserAuthService : SessionUserAuthService;
    const tokenStore = options.driver === 'jwt' && options.tokenStore === 'database' ? DatabaseTokenStore : RedisTokenStore;
    const sessionStore = options.driver === 'session' && options.sessionStore === 'redis' ? RedisSessionStore : DatabaseSessionStore;

    return {
      module: UserAuthModule,
      global: true,
      providers: [
        UserJwtAdapter,
        UserAuthGuard,
        selectedService,
        ...(options.driver === 'jwt' ? [tokenStore, { provide: TOKEN_STORE, useExisting: tokenStore }] : []),
        ...(options.driver === 'session'
          ? [SessionService, sessionStore, { provide: SESSION_STORE, useExisting: sessionStore }, ExpressSessionMiddleware]
          : []),
        { provide: USER_AUTH_SERVICE, useExisting: selectedService },
        { provide: USER_AUTH_DRIVER, useValue: options.driver },
      ],
      exports: [UserJwtAdapter, UserAuthGuard, USER_AUTH_DRIVER, USER_AUTH_SERVICE, ...(options.driver === 'jwt' ? [TOKEN_STORE] : []), ...(options.driver === 'session' ? [ExpressSessionMiddleware] : [])],
    };
  }
}
