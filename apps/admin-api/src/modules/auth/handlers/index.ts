import { ChangePasswordHandler } from '#/modules/auth/handlers/change-password.handler';
import { DisableTwoFactorHandler } from '#/modules/auth/handlers/disable-two-factor.handler';
import { EnableTwoFactorHandler } from '#/modules/auth/handlers/enable-two-factor.handler';
import { FindIdHandler } from '#/modules/auth/handlers/find-id.handler';
import { GenerateTwoFactorHandler } from '#/modules/auth/handlers/generate-two-factor.handler';
import { RegisterHandler } from '#/modules/auth/handlers/register.handler';
import { RequestEmailVerificationHandler } from '#/modules/auth/handlers/request-email-verification.handler';
import { RequestPasswordResetHandler } from '#/modules/auth/handlers/request-password-reset.handler';
import { ResetPasswordHandler } from '#/modules/auth/handlers/reset-password.handler';
import { UnregisterHandler } from '#/modules/auth/handlers/unregister.handler';
import { VerifyEmailHandler } from '#/modules/auth/handlers/verify-email.handler';

import { LoginHandler } from './login.handler';
import { LogoutHandler } from './logout.handler';
import { MeHandler } from './me.handler';
import { RefreshHandler } from './refresh.handler';
import { TwoFactorLoginHandler } from './two-factor-login.handler';
import { VerifyPhoneNumberHandler } from './verify-phone-number.handler';

export const authHandlers = [
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

export * from './login.handler';
export * from './logout.handler';
export * from './me.handler';
export * from './refresh.handler';
export * from './two-factor-login.handler';
export * from './verify-phone-number.handler';
export * from '#/modules/auth/handlers/change-password.handler';
export * from '#/modules/auth/handlers/disable-two-factor.handler';
export * from '#/modules/auth/handlers/enable-two-factor.handler';
export * from '#/modules/auth/handlers/find-id.handler';
export * from '#/modules/auth/handlers/generate-two-factor.handler';
export * from '#/modules/auth/handlers/request-email-verification.handler';
export * from '#/modules/auth/handlers/request-password-reset.handler';
export * from '#/modules/auth/handlers/reset-password.handler';
export * from '#/modules/auth/handlers/unregister.handler';
export * from '#/modules/auth/handlers/verify-email.handler';
