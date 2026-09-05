import { Injectable } from '@nestjs/common';

import { SystemConfig, type SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

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

export interface InquiryNotificationConfig {
  enabled?: boolean
  type: 'SLACK' | 'DISCORD' | 'WEBHOOK'
  webhookUrl: string
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
    const config = await this.getConfig<Partial<AuthPolicyConfig>>('security');
    const legacyConfig = !config ? await this.getConfig<Partial<AuthPolicyConfig>>('auth.policy' as SystemConfigKey) : null;
    const target = config ?? legacyConfig;
    return {
      allowRegistration: target?.allowRegistration ?? DEFAULT_AUTH_POLICY.allowRegistration,
      loginFailureThreshold: target?.loginFailureThreshold ?? DEFAULT_AUTH_POLICY.loginFailureThreshold,
      loginLockDurationMinutes: target?.loginLockDurationMinutes ?? DEFAULT_AUTH_POLICY.loginLockDurationMinutes,
      passwordExpirationDays: target?.passwordExpirationDays ?? DEFAULT_AUTH_POLICY.passwordExpirationDays,
    };
  }

  /**
   * 1:1 문의 운영 정책 조회 (미응답 감지 기준, 자동 종료 시간 등)
   */
  async getInquiryPolicy(): Promise<InquiryPolicyConfig> {
    const config = await this.getConfig<Partial<InquiryPolicyConfig>>('inquiry');
    const legacyConfig = !config ? await this.getConfig<Partial<InquiryPolicyConfig>>('inquiry.policy' as SystemConfigKey) : null;
    const target = config ?? legacyConfig;
    return {
      unansweredThresholdMinutes: target?.unansweredThresholdMinutes ?? DEFAULT_INQUIRY_POLICY.unansweredThresholdMinutes,
      autoCloseHours: target?.autoCloseHours ?? DEFAULT_INQUIRY_POLICY.autoCloseHours,
    };
  }

  /**
   * 1:1 문의 알림 설정 조회
   */
  async getInquiryNotification(): Promise<InquiryNotificationConfig | null> {
    const inquiry = await this.getConfig<{ notification?: InquiryNotificationConfig }>('inquiry');
    if (inquiry?.notification?.enabled !== false && inquiry?.notification?.webhookUrl && inquiry.notification.webhookUrl.trim().length > 0) {
      return {
        enabled: inquiry.notification.enabled ?? true,
        type: inquiry.notification.type ?? 'SLACK',
        webhookUrl: inquiry.notification.webhookUrl.trim(),
      };
    }
    const legacy = await this.getConfig<SlackNotificationConfig>('notification.slack' as SystemConfigKey);
    if (legacy?.webhookUrl && legacy.webhookUrl.trim().length > 0) {
      return {
        type: 'SLACK',
        webhookUrl: legacy.webhookUrl.trim(),
      };
    }
    return null;
  }

  /**
   * 슬랙 웹훅 URL 조회 (DB system_config 기반 - 하위 호환성 유지)
   */
  async getSlackWebhookUrl(): Promise<string> {
    const noti = await this.getInquiryNotification();
    return noti?.webhookUrl ?? '';
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
