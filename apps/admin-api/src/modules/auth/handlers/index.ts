import { LoginHandler } from './login.handler';
import { LogoutHandler } from './logout.handler';
import { MeHandler } from './me.handler';
import { ChangePasswordHandler, DisableTwoFactorHandler, EnableTwoFactorHandler, GenerateTwoFactorHandler, UnregisterHandler } from './profile-security.handler';
import { RefreshHandler } from './refresh.handler';
import { TwoFactorLoginHandler } from './two-factor-login.handler';
import { VerifyIdentityHandler } from './verify-identity.handler';

export const authHandlers = [
  LoginHandler,
  TwoFactorLoginHandler,
  RefreshHandler,
  LogoutHandler,
  MeHandler,
  ChangePasswordHandler,
  GenerateTwoFactorHandler,
  EnableTwoFactorHandler,
  DisableTwoFactorHandler,
  UnregisterHandler,
  VerifyIdentityHandler,
] as const;

export * from './login.handler';
export * from './logout.handler';
export * from './me.handler';
export * from './profile-security.handler';
export * from './refresh.handler';
export * from './two-factor-login.handler';
export * from './verify-identity.handler';
