import { Injectable } from '@nestjs/common';

import { SystemConfig } from '#/entities/system-config/system-config.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import type { SystemConfigKey } from '#/modules/system-config/dto';

export interface AuthPolicyConfig {
  allowRegistration: boolean
  loginFailureThreshold: number
  loginLockDurationMinutes: number
  passwordExpirationDays: number
}

export interface InquiryPolicyConfig {
  unansweredThresholdMinutes: number
  autoCloseHours: number
}

export interface SlackNotificationConfig {
  webhookUrl: string
}

const DEFAULT_AUTH_POLICY: AuthPolicyConfig = {
  allowRegistration: true,
  loginFailureThreshold: 5,
  loginLockDurationMinutes: 15,
  passwordExpirationDays: 90,
};

const DEFAULT_INQUIRY_POLICY: InquiryPolicyConfig = {
  unansweredThresholdMinutes: 10,
  autoCloseHours: 72,
};

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  /**
   * 인증 및 보안 정책 조회 (로그인 실패 잠금, 비밀번호 만료 등)
   */
  async getAuthPolicy(): Promise<AuthPolicyConfig> {
    const config = await this.getConfig<Partial<AuthPolicyConfig>>('auth.policy');
    return {
      allowRegistration: config?.allowRegistration ?? DEFAULT_AUTH_POLICY.allowRegistration,
      loginFailureThreshold: config?.loginFailureThreshold ?? DEFAULT_AUTH_POLICY.loginFailureThreshold,
      loginLockDurationMinutes: config?.loginLockDurationMinutes ?? DEFAULT_AUTH_POLICY.loginLockDurationMinutes,
      passwordExpirationDays: config?.passwordExpirationDays ?? DEFAULT_AUTH_POLICY.passwordExpirationDays,
    };
  }

  /**
   * 1:1 문의 운영 정책 조회 (미응답 감지 기준, 자동 종료 시간 등)
   */
  async getInquiryPolicy(): Promise<InquiryPolicyConfig> {
    const config = await this.getConfig<Partial<InquiryPolicyConfig>>('inquiry.policy');
    return {
      unansweredThresholdMinutes: config?.unansweredThresholdMinutes ?? DEFAULT_INQUIRY_POLICY.unansweredThresholdMinutes,
      autoCloseHours: config?.autoCloseHours ?? DEFAULT_INQUIRY_POLICY.autoCloseHours,
    };
  }

  /**
   * 슬랙 웹훅 URL 조회 (DB 설정 우선, 부재 시 환경변수 Fallback)
   */
  async getSlackWebhookUrl(): Promise<string> {
    const config = await this.getConfig<SlackNotificationConfig>('notification.slack');
    if (config?.webhookUrl && config.webhookUrl.trim().length > 0) {
      return config.webhookUrl.trim();
    }
    return env.SLACK_WEBHOOK_URL ?? '';
  }

  /**
   * 단일 설정 키 DB 조회
   */
  async getConfig<T>(key: SystemConfigKey): Promise<T | null> {
    const entity = await this.em.findOne(SystemConfig, { key }, { filters: false });
    if (!entity) return null;
    return entity.value as T;
  }
}
