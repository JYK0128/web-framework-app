import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { PORTONE_MODULE_OPTIONS, type PortOneModuleOptions, type PortOneVerifiedCustomer, type PortOneVerifiedIdentity } from '#/infra/portone/portone.interface';

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
export class PortOneService {
  private readonly logger = new Logger(PortOneService.name);

  constructor(
    @Inject(PORTONE_MODULE_OPTIONS)
    private readonly options: PortOneModuleOptions,
  ) {}

  async getVerifiedIdentity(identityVerificationId: string): Promise<PortOneVerifiedIdentity> {
    if (!identityVerificationId || !identityVerificationId.trim()) {
      throw new ApplicationError({
        code: 'INVALID_IDENTITY_VERIFICATION_ID',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const baseUrl = this.options.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/identity-verifications/${encodeURIComponent(identityVerificationId)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `PortOne ${this.options.apiSecret}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.options.timeoutMs),
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
