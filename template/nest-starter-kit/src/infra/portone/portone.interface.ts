export interface PortOneVerifiedCustomer {
  name: string
  phoneNumber: string
  birthDate?: string
  gender?: 'MALE' | 'FEMALE'
  ci?: string
  di?: string
}

export interface PortOneVerifiedIdentity extends PortOneVerifiedCustomer {
  id: string
}

export const PORTONE_MODULE_OPTIONS = Symbol('PORTONE_MODULE_OPTIONS');

export interface PortOneModuleOptions {
  apiSecret: string
  baseUrl: string
  timeoutMs: number
  storeId?: string
}
