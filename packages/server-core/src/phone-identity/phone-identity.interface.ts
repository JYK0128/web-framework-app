import type { RetryOptions } from '@pkg/shared/common';

export interface PhoneIdentityModuleOptions {
  apiSecret?: string
  requestTimeoutSeconds?: number
  retry?: RetryOptions
}

export const PHONE_IDENTITY_MODULE_OPTIONS = Symbol('PHONE_IDENTITY_MODULE_OPTIONS');
