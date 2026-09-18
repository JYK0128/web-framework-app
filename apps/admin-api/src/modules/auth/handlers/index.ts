import { LoginCredentialHandler } from './login-credential.handler';
import { LogoutHandler } from './logout.handler';
import { MeHandler } from './me.handler';
import { TokenRefreshHandler } from './token-refresh.handler';

export const authHandlers = [
  LoginCredentialHandler,
  TokenRefreshHandler,
  LogoutHandler,
  MeHandler,
] as const;

export * from './login-credential.handler';
export * from './logout.handler';
export * from './me.handler';
export * from './token-refresh.handler';
