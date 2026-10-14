import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PortOneAdapter } from '@pkg/server-core/phone-identity/adapters/portone.adapter';
import { ApplicationError, normalizePhoneNumber } from '@pkg/shared/common';

import { PHONE_IDENTITY_MODULE_OPTIONS, type PhoneIdentityModuleOptions } from './phone-identity.interface';

@Injectable()
export class PhoneIdentityService {
  constructor(private readonly adapter: PortOneAdapter, @Inject(PHONE_IDENTITY_MODULE_OPTIONS) private readonly options: PhoneIdentityModuleOptions) {}

  async verify(identityVerificationId: string): Promise<{ name: string, phoneNumber: string, ci?: string, di?: string }> {
    if (!this.options.apiSecret) throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    if (!identityVerificationId.trim()) throw new ApplicationError({ code: 'INVALID_IDENTITY_VERIFICATION_ID', status: HttpStatus.BAD_REQUEST });

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
