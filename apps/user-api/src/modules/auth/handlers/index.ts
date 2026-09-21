import { LoginHandler } from './login.handler';
import { LogoutHandler } from './logout.handler';
import { MeHandler } from './me.handler';
import { RefreshHandler } from './refresh.handler';

export const authHandlers = [
  LoginHandler,
  RefreshHandler,
  LogoutHandler,
  MeHandler,
] as const;

export * from './login.handler';
export * from './logout.handler';
export * from './me.handler';
export * from './refresh.handler';
