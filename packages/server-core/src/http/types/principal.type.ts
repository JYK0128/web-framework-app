export type AuthPrincipal
  = | {
    type: 'user'
    id: string
    roles: string[]
    permissions: string[]
    phoneNumberVerified: boolean
    twoFactorSetupRequired: boolean
    passwordExpiresAt: number | null
  }
  | {
    type: 'machine'
    id: string
  };
