import { ChangePasswordHandler } from './change-password.handler';
import { DisableTwoFactorHandler } from './disable-two-factor.handler';
import { EmailVerificationHandler } from './email-verification.handler';
import { EnableTwoFactorHandler } from './enable-two-factor.handler';
import { FindIdHandler } from './find-id.handler';
import { GenerateTwoFactorHandler } from './generate-two-factor.handler';
import { LoginHandler } from './login.handler';
import { LogoutHandler } from './logout.handler';
import { MeHandler } from './me.handler';
import { PasswordResetEmailHandler } from './password-reset-email.handler';
import { RefreshHandler } from './refresh.handler';
import { RegisterHandler } from './register.handler';
import { RequestEmailVerificationHandler } from './request-email-verification.handler';
import { RequestPasswordResetHandler } from './request-password-reset.handler';
import { ResetPasswordHandler } from './reset-password.handler';
import { TwoFactorLoginHandler } from './two-factor-login.handler';
import { UnregisterHandler } from './unregister.handler';
import { VerifyEmailHandler } from './verify-email.handler';
import { VerifyPhoneNumberHandler } from './verify-phone-number.handler';

export const authHandlers = [
  EmailVerificationHandler,
  PasswordResetEmailHandler,
  LoginHandler,
  FindIdHandler,
  RequestEmailVerificationHandler,
  RequestPasswordResetHandler,
  ResetPasswordHandler,
  VerifyEmailHandler,
  TwoFactorLoginHandler,
  RefreshHandler,
  LogoutHandler,
  MeHandler,
  ChangePasswordHandler,
  GenerateTwoFactorHandler,
  EnableTwoFactorHandler,
  DisableTwoFactorHandler,
  UnregisterHandler,
  RegisterHandler,
  VerifyPhoneNumberHandler,
] as const;

export * from './change-password.handler';
export * from './disable-two-factor.handler';
export * from './email-verification.handler';
export * from './enable-two-factor.handler';
export * from './find-id.handler';
export * from './generate-two-factor.handler';
export * from './login.handler';
export * from './logout.handler';
export * from './me.handler';
export * from './password-reset-email.handler';
export * from './refresh.handler';
export * from './request-email-verification.handler';
export * from './request-password-reset.handler';
export * from './reset-password.handler';
export * from './two-factor-login.handler';
export * from './unregister.handler';
export * from './verify-email.handler';
export * from './verify-phone-number.handler';
