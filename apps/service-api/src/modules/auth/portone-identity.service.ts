import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil, withRetry } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/config';
import { env } from '#/env';

export interface VerifiedIdentity {
  name: string
  phoneNumber: string
}

@Injectable()
export class PortoneIdentityService {
  async verify(identityVerificationId: string): Promise<VerifiedIdentity> {
    if (!env.PORTONE_API_SECRET) {
      throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    }
    if (!identityVerificationId.trim()) {
      throw new ApplicationError({ code: 'INVALID_IDENTITY_VERIFICATION_ID', status: HttpStatus.BAD_REQUEST });
    }

    let result: { id?: string, status?: string, verifiedCustomer?: { name?: string, phoneNumber?: string } };
    try {
      result = await withRetry(async () => {
        const response = await fetch(`https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`, {
          headers: { Authorization: `PortOne ${env.PORTONE_API_SECRET}` },
          signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.identityVerification.requestTimeoutSeconds)),
        });
        if (response.status >= 500) throw new Error(`PortOne server error: ${response.status}`);
        if (!response.ok) throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_FAILED', status: HttpStatus.BAD_REQUEST });
        return await response.json() as typeof result;
      }, {
        maxRetries: SECURITY_CONFIG.identityVerification.maxRetries,
        initialDelayMs: SECURITY_CONFIG.identityVerification.retryDelayMilliseconds,
        maxDelayMs: SECURITY_CONFIG.identityVerification.retryMaxDelayMilliseconds,
        backoffFactor: SECURITY_CONFIG.identityVerification.retryBackoffFactor,
        jitter: SECURITY_CONFIG.identityVerification.retryJitterEnabled,
        shouldRetry: (error) => !(error instanceof ApplicationError),
      });
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_PROVIDER_ERROR', status: HttpStatus.BAD_GATEWAY });
    }
    const customer = result.verifiedCustomer;
    if (result.id !== identityVerificationId || result.status !== 'VERIFIED' || !customer?.name || !customer.phoneNumber) {
      throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_FAILED', status: HttpStatus.BAD_REQUEST });
    }
    return {
      name: customer.name.trim(),
      phoneNumber: customer.phoneNumber.replace(/[^0-9+]/gu, ''),
    };
  }
}
