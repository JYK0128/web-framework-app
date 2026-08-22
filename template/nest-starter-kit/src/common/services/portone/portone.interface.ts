export interface PortOneVerifiedIdentity {
  id: string
  name: string
  phoneNumber: string
  birthDate?: string
  gender?: 'MALE' | 'FEMALE'
  ci?: string
  di?: string
}

export const PORTONE_MODULE_OPTIONS = Symbol('PORTONE_MODULE_OPTIONS');

export interface PortOneModuleOptions {
  apiSecret?: string
}
