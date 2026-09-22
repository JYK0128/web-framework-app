import { LoginHandler } from './login.handler';
import { LogoutHandler } from './logout.handler';
import { MeHandler } from './me.handler';
import { ChangePasswordHandler, DisableTwoFactorHandler, EnableTwoFactorHandler, GenerateTwoFactorHandler, UnregisterHandler } from './profile-security.handler';
import { RefreshHandler } from './refresh.handler';

export const authHandlers = [
  LoginHandler,
  RefreshHandler,
  LogoutHandler,
  MeHandler,
  ChangePasswordHandler,
  GenerateTwoFactorHandler,
  EnableTwoFactorHandler,
  DisableTwoFactorHandler,
  UnregisterHandler,
] as const;

export * from './login.handler';
export * from './logout.handler';
export * from './me.handler';
export * from './profile-security.handler';
export * from './refresh.handler';
