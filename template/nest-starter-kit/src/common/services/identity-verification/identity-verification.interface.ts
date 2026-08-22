export interface VerifiedIdentity {
  id: string
  name: string
  phoneNumber: string
  birthDate?: string
  gender?: 'MALE' | 'FEMALE'
  ci?: string
  di?: string
}

export interface IIdentityVerificationProvider {
  readonly providerName: string
  getVerifiedIdentity(identityVerificationId: string): Promise<VerifiedIdentity>
}

export const IDENTITY_VERIFICATION_PROVIDER = Symbol('IDENTITY_VERIFICATION_PROVIDER');
export const IDENTITY_VERIFICATION_MODULE_OPTIONS = Symbol('IDENTITY_VERIFICATION_MODULE_OPTIONS');

export interface IdentityVerificationModuleOptions {
  apiSecret?: string
}
