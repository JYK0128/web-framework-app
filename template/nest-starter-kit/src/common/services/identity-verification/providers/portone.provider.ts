import { HttpStatus, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { IDENTITY_VERIFICATION_MODULE_OPTIONS, type IdentityVerificationModuleOptions, type IIdentityVerificationProvider, type VerifiedIdentity } from '#/common/services/identity-verification/identity-verification.interface';
import { env } from '#/env';

interface PortOneVerifiedCustomer {
  name: string
  phoneNumber: string
  birthDate?: string
  gender?: 'MALE' | 'FEMALE'
  ci?: string
  di?: string
}

interface PortOneIdentityVerificationResponse {
  status: 'READY' | 'VERIFIED' | 'FAILED'
  id: string
  verifiedCustomer?: PortOneVerifiedCustomer
  failure?: {
    reason?: string
    message?: string
  }
}

@Injectable()
export class PortOneIdentityVerificationProvider implements IIdentityVerificationProvider {
  readonly providerName = 'portone';
  private readonly logger = new Logger(PortOneIdentityVerificationProvider.name);
  private readonly apiSecret: string;

  constructor(
    @Optional()
    @Inject(IDENTITY_VERIFICATION_MODULE_OPTIONS)
    options?: IdentityVerificationModuleOptions,
  ) {
    this.apiSecret = options?.apiSecret || env.PORTONE_API_SECRET;
  }

  async getVerifiedIdentity(identityVerificationId: string): Promise<VerifiedIdentity> {
    if (!identityVerificationId || !identityVerificationId.trim()) {
      throw new ApplicationError({
        code: 'INVALID_IDENTITY_VERIFICATION_ID',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const url = `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `PortOne ${this.apiSecret}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        this.logger.error(`PortOne API error: [${response.status}] ${errorBody}`);
        throw new ApplicationError({
          code: 'IDENTITY_VERIFICATION_FAILED',
          status: HttpStatus.BAD_REQUEST,
          message: '본인인증 정보를 조회할 수 없습니다.',
        });
      }

      const data = (await response.json()) as PortOneIdentityVerificationResponse;

      if (data.status !== 'VERIFIED' || !data.verifiedCustomer) {
        this.logger.warn(`Identity verification not verified. Status: ${data.status}, Reason: ${data.failure?.message || data.failure?.reason}`);
        throw new ApplicationError({
          code: 'IDENTITY_VERIFICATION_FAILED',
          status: HttpStatus.BAD_REQUEST,
          message: data.failure?.message || '본인인증이 완료되지 않았습니다.',
        });
      }

      const { name, phoneNumber, birthDate, gender, ci, di } = data.verifiedCustomer;

      if (!phoneNumber) {
        throw new ApplicationError({
          code: 'IDENTITY_VERIFICATION_PHONE_MISSING',
          status: HttpStatus.BAD_REQUEST,
          message: '본인인증 결과에 휴대폰 번호가 누락되었습니다.',
        });
      }

      return {
        id: data.id,
        name: name || '',
        phoneNumber: this.normalizePhoneNumber(phoneNumber),
        birthDate,
        gender,
        ci,
        di,
      };
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;

      this.logger.error(`Failed to fetch PortOne identity verification: ${error instanceof Error ? error.message : String(error)}`);
      throw new ApplicationError({
        code: 'IDENTITY_VERIFICATION_FAILED',
        status: HttpStatus.BAD_GATEWAY,
        message: '본인인증 서비스와 통신 중 오류가 발생했습니다.',
      });
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^0-9+]/g, '');
  }
}
