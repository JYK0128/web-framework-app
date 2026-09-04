import 'express-session';

import type { RoleKey, RolePermissions } from '#/entities/auth.extentions/role.entity';

declare module 'express-session' {
  interface AuthPrincipal {
    id: string
    name: string
    email: string
    emailVerified: boolean
    phoneNumber: string | null
    phoneNumberVerified: boolean
    role: RoleKey | null
    permissions: RolePermissions
    requiredTermsAgreed: boolean
    passwordUpdatedAt: Date | null
    isPasswordChangeRequired: boolean
    twoFactorEnabled: boolean
  }

  interface SessionData {
    user?: AuthPrincipal
  }
}
