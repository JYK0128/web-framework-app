import { LoginHandler } from './login.handler';
import { LogoutHandler } from './logout.handler';
import { MeHandler } from './me.handler';
import { RequestPasswordResetHandler, ResetPasswordHandler } from './password-recovery.handler';
import { DisableTwoFactorHandler, EnableTwoFactorHandler, GenerateTwoFactorHandler } from './profile-security.handler';
import { RefreshHandler } from './refresh.handler';
import { RegisterHandler, ResendEmailVerificationHandler, VerifyEmailHandler } from './registration.handler';
import { VerifyIdentityHandler } from './verify-identity.handler';

export const authHandlers = [
  LoginHandler,
  RefreshHandler,
  LogoutHandler,
  MeHandler,
  GenerateTwoFactorHandler,
  EnableTwoFactorHandler,
  DisableTwoFactorHandler,
  VerifyIdentityHandler,
  RegisterHandler,
  VerifyEmailHandler,
  ResendEmailVerificationHandler,
  RequestPasswordResetHandler,
  ResetPasswordHandler,
] as const;

export * from './login.handler';
export * from './logout.handler';
export * from './me.handler';
export * from './password-recovery.handler';
export * from './profile-security.handler';
export * from './refresh.handler';
export * from './registration.handler';
export * from './verify-identity.handler';
