import { type DynamicModule, HttpStatus, Inject, MiddlewareConsumer, Module, type NestModule, Optional, type Provider, RequestMethod, type Type } from '@nestjs/common';
import { ExpressSessionMiddleware } from '@pkg/server-core/auth/user/adapters/express-session.middleware';
import { UserJwtService } from '@pkg/server-core/auth/user/adapters/user-jwt.service';
import { SESSION_MIDDLEWARE_TYPE, type SessionMiddlewareType } from '@pkg/server-core/auth/user/session/session.interface';
import { SessionService } from '@pkg/server-core/auth/user/session/session.service';
import { SessionStore } from '@pkg/server-core/auth/user/session/session.store';
import { TokenStore } from '@pkg/server-core/auth/user/token/stores/token.store';
import { UserAuthGuard } from '@pkg/server-core/auth/user/user-auth.guard';
import { AUTH_READER, type AuthReader, type IUserAuthService, USER_AUTH_OPTIONS, USER_AUTH_POLICY_OPTIONS, USER_AUTH_SERVICE, USER_JWT_OPTIONS, USER_SESSION_OPTIONS, type UserAuthModuleOptions } from '@pkg/server-core/auth/user/user-auth.interface';
import { ApplicationError } from '@pkg/shared/common';

interface UserAuthModuleAdapterBase {
  reader: Type<AuthReader>
}

type TokenStoreAdapter = { tokenStore: Type<TokenStore> };
type SessionStoreAdapter = { sessionStore: Type<SessionStore> };

export type UserAuthModuleAdapters<TOptions extends UserAuthModuleOptions = UserAuthModuleOptions>
  = UserAuthModuleAdapterBase
    & (TOptions extends { driver: 'jwt' } ? TokenStoreAdapter : {})
    & (TOptions extends { driver: 'session' } ? SessionStoreAdapter : {});

@Module({})
export class UserAuthModule implements NestModule {
  constructor(
    @Inject(USER_AUTH_OPTIONS) private readonly options: UserAuthModuleOptions,
    @Optional() @Inject(SESSION_MIDDLEWARE_TYPE) private readonly sessionMiddleware?: SessionMiddlewareType,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    if (this.options.driver !== 'session') return;
    if (!this.sessionMiddleware) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
    consumer.apply(this.sessionMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }

  static forRoot<TOptions extends UserAuthModuleOptions>(options: TOptions, adapters: UserAuthModuleAdapters<TOptions>): DynamicModule {
    const selectedService: Type<IUserAuthService> = options.driver === 'jwt' ? UserJwtService : SessionService;
    const providers: Provider[] = [
      { provide: USER_AUTH_OPTIONS, useValue: options },
      { provide: USER_AUTH_POLICY_OPTIONS, useValue: options.policy },
      { provide: AUTH_READER, useClass: adapters.reader },
      { provide: USER_AUTH_SERVICE, useClass: selectedService },
      UserAuthGuard,
    ];
    const exports: DynamicModule['exports'] = [UserAuthGuard, USER_AUTH_SERVICE];

    if (options.driver === 'jwt') {
      const tokenStore = requireAdapter((adapters as Partial<TokenStoreAdapter>).tokenStore, 'tokenStore');
      providers.push(
        { provide: USER_JWT_OPTIONS, useValue: options.jwt },
        { provide: TokenStore, useClass: tokenStore },
      );
      exports.push(TokenStore);
    }
    else {
      const sessionStore = requireAdapter((adapters as Partial<SessionStoreAdapter>).sessionStore, 'sessionStore');
      providers.push(
        { provide: USER_SESSION_OPTIONS, useValue: options.session },
        { provide: SessionStore, useClass: sessionStore },
        ExpressSessionMiddleware,
        { provide: SESSION_MIDDLEWARE_TYPE, useExisting: ExpressSessionMiddleware },
      );
      exports.push(SessionStore);
    }
    return { module: UserAuthModule, global: true, providers, exports };
  }
}

function requireAdapter<T>(adapter: T | undefined, name: string): T {
  if (adapter === undefined) throw new Error(`UserAuthModule requires the ${name} adapter for the selected store driver`);
  return adapter;
}
