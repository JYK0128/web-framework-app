import { FindIdHandler } from './find-id.handler';
import { LoginHandler } from './login.handler';
import { LogoutHandler } from './logout.handler';
import { MeHandler } from './me.handler';
import { RequestPasswordResetHandler, ResetPasswordHandler } from './password-recovery.handler';
import { ChangePasswordHandler, DisableTwoFactorHandler, EnableTwoFactorHandler, GenerateTwoFactorHandler, UnregisterHandler } from './profile-security.handler';
import { RefreshHandler } from './refresh.handler';
import { RegisterHandler, RequestEmailVerificationHandler, VerifyEmailHandler } from './registration.handler';
import { TwoFactorLoginHandler } from './two-factor-login.handler';
import { VerifyPhoneNumberHandler } from './verify-phone-number.handler';

export const authHandlers = [
  LoginHandler,
  TwoFactorLoginHandler,
  RefreshHandler,
  LogoutHandler,
  MeHandler,
  FindIdHandler,
  GenerateTwoFactorHandler,
  ChangePasswordHandler,
  EnableTwoFactorHandler,
  DisableTwoFactorHandler,
  UnregisterHandler,
  VerifyPhoneNumberHandler,
  RegisterHandler,
  VerifyEmailHandler,
  RequestEmailVerificationHandler,
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
export * from './two-factor-login.handler';
export * from './verify-phone-number.handler';
