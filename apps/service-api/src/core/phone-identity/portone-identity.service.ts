import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { PortoneIdentityAdapter } from '#/core/phone-identity/adapters/portone-identity.adapter';
import { env } from '#/env';

export interface VerifiedIdentity {
  name: string
  phoneNumber: string
  ci?: string
  di?: string
}

@Injectable()
export class PortoneIdentityService {
  constructor(private readonly adapter: PortoneIdentityAdapter) {}

  async verify(identityVerificationId: string): Promise<VerifiedIdentity> {
    if (!env.PORTONE_API_SECRET) {
      throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    }
    if (!identityVerificationId.trim()) {
      throw new ApplicationError({ code: 'INVALID_IDENTITY_VERIFICATION_ID', status: HttpStatus.BAD_REQUEST });
    }

    const result = await this.adapter.fetchVerification(identityVerificationId);
    const customer = result.verifiedCustomer;
    if (result.id !== identityVerificationId || result.status !== 'VERIFIED' || !customer?.name || !customer.phoneNumber) {
      throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_FAILED', status: HttpStatus.BAD_REQUEST });
    }
    return {
      name: customer.name.trim(),
      phoneNumber: normalizePhoneNumber(customer.phoneNumber),
      ...(customer.ci ? { ci: customer.ci } : {}),
      ...(customer.di ? { di: customer.di } : {}),
    };
  }
}

function normalizePhoneNumber(value: string): string {
  const digits = value.replace(/\D/gu, '');
  if (digits.startsWith('82')) return `0${digits.slice(2)}`;
  return digits;
}
