import 'express-session';

import type { RoleName, RolePermissions } from '#/entities/auth.extentions/role.entity';

declare module 'express-session' {
  interface AuthPrincipal {
    id: string
    name: string
    email: string
    emailVerified: boolean
    role: RoleName | null
    permissions: RolePermissions
    requiredTermsAgreed: boolean
    passwordUpdatedAt: Date | null
    isPasswordChangeRequired: boolean
  }

  interface SessionData {
    user?: AuthPrincipal
  }
}
