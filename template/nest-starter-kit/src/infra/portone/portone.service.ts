import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError, withRetry } from '@pkg/shared/common';

import { PORTONE_API_BASE_URL, PORTONE_HTTP_TIMEOUT_MS, PORTONE_MAX_RETRIES, PORTONE_RETRY_DELAY_MS } from '#/common/configs/integration.config';
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
    this.validateVerificationId(identityVerificationId);

    this.logger.log(`[PortOne] 본인인증 조회 요청 (ID: ${identityVerificationId})`);
    const url = `${PORTONE_API_BASE_URL}/identity-verifications/${encodeURIComponent(identityVerificationId)}`;
    const data = await this.executeRequestWithRetry(url);

    const verifiedIdentity = this.parseVerificationResponse(data);
    this.logger.log(`[PortOne] 본인인증 조회 성공 (ID: ${identityVerificationId}, 이름: ${verifiedIdentity.name})`);
    return verifiedIdentity;
  }

  private validateVerificationId(identityVerificationId: string): void {
    if (!identityVerificationId || !identityVerificationId.trim()) {
      throw new ApplicationError({
        code: 'INVALID_IDENTITY_VERIFICATION_ID',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private async executeRequestWithRetry(url: string): Promise<PortOneIdentityVerificationResponse> {
    const timeoutMs = this.options.timeoutMs ?? PORTONE_HTTP_TIMEOUT_MS;
    const maxRetries = this.options.maxRetries ?? PORTONE_MAX_RETRIES;
    const initialDelayMs = this.options.retryDelayMs ?? PORTONE_RETRY_DELAY_MS;

    try {
      return await withRetry(
        () => this.sendSingleRequest(url, timeoutMs),
        {
          maxRetries,
          initialDelayMs,
          shouldRetry: (error) => !(error instanceof ApplicationError),
          onRetry: (error, attempt, delayMs) => {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.warn(`PortOne API request failed (${errorMsg}). Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`);
          },
        },
      );
    }
    catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      this.logger.error(`Failed to fetch PortOne identity verification after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : String(error)}`);
      throw new ApplicationError({
        code: 'IDENTITY_VERIFICATION_FAILED',
        status: HttpStatus.BAD_GATEWAY,
        message: '본인인증 서비스와 통신 중 오류가 발생했습니다.',
      });
    }
  }

  private async sendSingleRequest(url: string, timeoutMs: number): Promise<PortOneIdentityVerificationResponse> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `PortOne ${this.options.apiSecret}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`PortOne API error: [${response.status}] ${errorBody}`);

      if (response.status >= 500) {
        throw new Error(`PortOne server error [${response.status}]`);
      }

      throw new ApplicationError({
        code: 'IDENTITY_VERIFICATION_FAILED',
        status: HttpStatus.BAD_REQUEST,
        message: '본인인증 정보를 조회할 수 없습니다.',
      });
    }

    return (await response.json()) as PortOneIdentityVerificationResponse;
  }

  private parseVerificationResponse(data: PortOneIdentityVerificationResponse): PortOneVerifiedIdentity {
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

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^0-9+]/g, '');
  }
}
