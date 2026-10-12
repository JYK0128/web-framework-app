import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, withRetry } from '@pkg/shared/common';
import { z } from 'zod';

import { SECURITY_CONFIG } from '#/app.config';
import { getPortOneVerification } from '#/core/phone-identity/portone.http';

const verificationSchema = z.object({
  id: z.string(),
  status: z.string(),
  verifiedCustomer: z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    ci: z.string().optional(),
    di: z.string().optional(),
  }).nullish(),
});

@Injectable()
export class PortOneAdapter {
  async fetchVerification(identityVerificationId: string) {
    let result: z.infer<typeof verificationSchema>;
    try {
      result = await withRetry(async () => {
        const response = await getPortOneVerification(identityVerificationId);
        if (response.status >= 500) throw new Error(`PortOne server error: ${response.status}`);
        if (response.status < 200 || response.status >= 300) throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_FAILED', status: HttpStatus.BAD_REQUEST });
        return verificationSchema.parse(response.data);
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
      throw ApplicationError.from(error, { code: 'IDENTITY_VERIFICATION_PROVIDER_ERROR', status: HttpStatus.BAD_GATEWAY });
    }
    return result;
  }
}
