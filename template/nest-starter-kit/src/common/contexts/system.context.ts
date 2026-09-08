import { HttpStatus, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { BCRYPT_MAX_INPUT_BYTES } from '@pkg/shared/server';
import { plainToInstance } from 'class-transformer';
import { ClsService } from 'nestjs-cls';

import { SYSTEM_CONFIG_MEMORY_TTL_MS, SYSTEM_CONFIG_REDIS_TTL_SECONDS } from '#/common/configs/runtime.config';
import { SystemConfig, SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store';
import { InquiryNotificationType, MaintenanceConfigDto, OAuthConfigDto, SecurityConfigDto } from '#/modules/system-config/dto';

import { RequestContext } from './request.context';

export interface AuthPolicyConfig {
  allowRegistration: boolean
  allowPasswordRegistration: boolean
  requireEmailVerification: boolean
  loginFailureThreshold: number
  loginLockDurationMinutes: number
  passwordChangeDeferDays: number
  passwordExpirationDays: number
  preventConcurrentLogin: boolean
  minPasswordLength: number
  requireSpecialChar: boolean
  requireNumbers: boolean
  requireUppercase: boolean
  historyLimit: number
  sessionTimeoutMinutes: number
  rememberMeDays: number
  oauthStateTtlMinutes: number
  verification: VerificationPolicyConfig
}

export interface VerificationPolicyConfig {
  emailChallengeExpiryMinutes: number
  passwordResetChallengeExpiryMinutes: number
  phoneChallengeExpiryMinutes: number
}

export interface MaintenanceStatus {
  isActive: boolean
  message: string
}

export interface TwoFactorPolicyConfig {
  enforceAdmin2FA: boolean
  allowUser2FA: boolean
  challengeTtlMinutes: number
}

export interface InquiryPolicyConfig {
  unansweredThresholdMinutes: number
  autoCloseHours: number
  notificationCooldownMinutes: number
}

export interface InquiryNotificationConfig {
  enabled?: boolean
  type: InquiryNotificationType
  webhookUrl: string
}

const kstTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const kstDayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
});

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const CLS_SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE_STATUS';
const CLS_SYSTEM_AUTH_POLICY = 'SYSTEM_AUTH_POLICY';
const CLS_SYSTEM_INQUIRY_POLICY = 'SYSTEM_INQUIRY_POLICY';

const SYSTEM_CONFIG_REDIS_PREFIX = 'sys_config:';

@Injectable()
export class SystemContext implements OnApplicationBootstrap {
  private readonly memoryCache = new Map<string, { value: unknown, expiresAt: number }>();

  constructor(
    private readonly cls: ClsService,
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly kvStore: KvStore,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.reloadFromDatabase();
  }

  /**
   * 인메모리, CLS 및 Redis(KvStore) 캐시 무효화 (특정 키 또는 전체)
   */
  async clearCache(keys?: readonly SystemConfigKey[]): Promise<void> {
    if (this.cls.isActive()) {
      this.cls.set(CLS_SYSTEM_MAINTENANCE, undefined);
      this.cls.set(CLS_SYSTEM_AUTH_POLICY, undefined);
      this.cls.set(CLS_SYSTEM_INQUIRY_POLICY, undefined);
    }

    if (!keys || keys.length === 0) {
      this.memoryCache.clear();
      const allKeys = Object.values(SystemConfigKey);
      await Promise.all(allKeys.map((k) => this.kvStore.del(`${SYSTEM_CONFIG_REDIS_PREFIX}${k}`)));
      return;
    }

    for (const key of keys) {
      this.memoryCache.delete(key);
      if (key === SystemConfigKey.SECURITY) this.memoryCache.delete('policy:auth');
      if (key === SystemConfigKey.INQUIRY) this.memoryCache.delete('policy:inquiry');
    }

    await Promise.all(
      keys.map((key) => this.kvStore.del(`${SYSTEM_CONFIG_REDIS_PREFIX}${key}`)),
    );
  }

  /** DB를 원본으로 전체 설정 캐시를 다시 구성합니다. */
  async reloadFromDatabase(): Promise<SystemConfigKey[]> {
    const keys = Object.values(SystemConfigKey);
    const entities = await this.em.fork().find(SystemConfig, { key: { $in: keys } }, { filters: false });
    await this.clearCache();
    for (const entity of entities) {
      await this.kvStore.set(`${SYSTEM_CONFIG_REDIS_PREFIX}${entity.key}`, entity.value, SYSTEM_CONFIG_REDIS_TTL_SECONDS);
    }
    for (const entity of entities) {
      this.memoryCache.set(entity.key, { value: entity.value, expiresAt: Date.now() + SYSTEM_CONFIG_MEMORY_TTL_MS });
    }
    return keys;
  }

  /**
   * 실시간 시스템 점검 활성화 여부 판정 (임시 점검 및 정기 점검 통합, 인메모리 및 CLS 캐시 적용)
   */
  async isMaintenanceActive(now: Date = new Date()): Promise<MaintenanceStatus> {
    if (this.cls.isActive()) {
      const cached = this.cls.get<MaintenanceStatus>(CLS_SYSTEM_MAINTENANCE);
      if (cached) return cached;
    }

    const raw = await this.getConfig<Record<string, unknown>>(SystemConfigKey.MAINTENANCE);
    if (!raw) {
      const status = { isActive: false, message: '' };
      if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_MAINTENANCE, status);
      return status;
    }

    const m = plainToInstance(MaintenanceConfigDto, raw);
    const tempStatus = this.checkTemporaryMaintenance(m, now);
    if (tempStatus) {
      if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_MAINTENANCE, tempStatus);
      return tempStatus;
    }

    const recurStatus = this.checkRecurringMaintenance(m, now);
    if (recurStatus) {
      if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_MAINTENANCE, recurStatus);
      return recurStatus;
    }

    const status = { isActive: false, message: '' };
    if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_MAINTENANCE, status);
    return status;
  }

  /**
   * 인증 및 보안 정책 조회 (인메모리 및 CLS 캐시 적용)
   */
  async getAuthPolicy(): Promise<AuthPolicyConfig> {
    if (this.cls.isActive()) {
      const cached = this.cls.get<AuthPolicyConfig>(CLS_SYSTEM_AUTH_POLICY);
      if (cached) return cached;
    }

    const now = Date.now();
    const cachedMemory = this.memoryCache.get('policy:auth');
    if (cachedMemory && cachedMemory.expiresAt > now) {
      const policy = cachedMemory.value as AuthPolicyConfig;
      if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_AUTH_POLICY, policy);
      return policy;
    }

    const target = await this.getConfig<Record<string, unknown>>(SystemConfigKey.SECURITY);
    const sec = plainToInstance(SecurityConfigDto, target);

    const policy: AuthPolicyConfig = {
      allowRegistration: sec.registration.allowRegistration,
      allowPasswordRegistration: sec.registration.allowPasswordRegistration,
      requireEmailVerification: sec.registration.requireEmailVerification,
      loginFailureThreshold: sec.lockout.maxFailureAttempts,
      loginLockDurationMinutes: sec.lockout.lockoutDurationMinutes,
      passwordChangeDeferDays: sec.password.changeDeferDays,
      passwordExpirationDays: sec.password.expirationDays,
      preventConcurrentLogin: sec.session.preventConcurrentLogin,
      minPasswordLength: sec.password.minLength,
      requireSpecialChar: sec.password.requireSpecialChar,
      requireNumbers: sec.password.requireNumbers,
      requireUppercase: sec.password.requireUppercase,
      historyLimit: sec.password.historyLimit,
      sessionTimeoutMinutes: sec.session.timeoutMinutes,
      rememberMeDays: sec.session.rememberMeDays,
      oauthStateTtlMinutes: sec.oauthStateTtlMinutes,
      verification: sec.verification,
    };

    this.memoryCache.set('policy:auth', { value: policy, expiresAt: now + SYSTEM_CONFIG_MEMORY_TTL_MS });
    if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_AUTH_POLICY, policy);
    return policy;
  }

  /**
   * 신규 회원가입 허용 여부
   */
  async isRegistrationAllowed(): Promise<boolean> {
    const policy = await this.getAuthPolicy();
    return policy.allowRegistration;
  }

  /**
   * 로컬(이메일/비밀번호) 신규 회원가입 허용 여부
   */
  async isPasswordRegistrationAllowed(): Promise<boolean> {
    const policy = await this.getAuthPolicy();
    return policy.allowRegistration && policy.allowPasswordRegistration;
  }

  /**
   * 2단계 인증 (2FA) 정책 조회
   */
  async getTwoFactorPolicy(): Promise<TwoFactorPolicyConfig> {
    const target = await this.getConfig<Record<string, unknown>>(SystemConfigKey.SECURITY);
    const sec = plainToInstance(SecurityConfigDto, target);
    return {
      enforceAdmin2FA: sec.twoFactor.enforceAdmin2FA,
      allowUser2FA: sec.twoFactor.allowUser2FA,
      challengeTtlMinutes: sec.twoFactor.challengeTtlMinutes,
    };
  }

  /**
   * 세션 만료 시간 (분 단위)
   */
  async getSessionTimeoutMinutes(): Promise<number> {
    const policy = await this.getAuthPolicy();
    return policy.sessionTimeoutMinutes;
  }

  async getRememberMeDays(): Promise<number> {
    return (await this.getAuthPolicy()).rememberMeDays;
  }

  async getOAuthStateTtlMinutes(): Promise<number> {
    return (await this.getAuthPolicy()).oauthStateTtlMinutes;
  }

  async getVerificationPolicy(): Promise<VerificationPolicyConfig> {
    return (await this.getAuthPolicy()).verification;
  }

  /**
   * 비밀번호 정책 검증 (최소 길이, 특수문자/숫자/대문자 필수 여부 등)
   */
  async validatePassword(password: string, policy?: AuthPolicyConfig): Promise<void> {
    const activePolicy = policy ?? (await this.getAuthPolicy());
    // bcrypt ignores bytes beyond its input limit; reject instead of truncating.
    if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_INPUT_BYTES) {
      throw new ApplicationError({
        code: 'PASSWORD_TOO_LONG',
        status: HttpStatus.BAD_REQUEST,
        params: { maxBytes: BCRYPT_MAX_INPUT_BYTES },
      });
    }
    if (password.length < activePolicy.minPasswordLength) {
      throw new ApplicationError({
        code: 'PASSWORD_TOO_SHORT',
        status: HttpStatus.BAD_REQUEST,
        params: { minLength: activePolicy.minPasswordLength },
      });
    }

    if (activePolicy.requireSpecialChar) {
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/;
      if (!specialCharRegex.test(password)) {
        throw new ApplicationError({
          code: 'PASSWORD_SPECIAL_CHAR_REQUIRED',
          status: HttpStatus.BAD_REQUEST,
        });
      }
    }

    if (activePolicy.requireNumbers) {
      if (!/\d/.test(password)) {
        throw new ApplicationError({
          code: 'PASSWORD_NUMBER_REQUIRED',
          status: HttpStatus.BAD_REQUEST,
        });
      }
    }

    if (activePolicy.requireUppercase) {
      if (!/[A-Z]/.test(password)) {
        throw new ApplicationError({
          code: 'PASSWORD_UPPERCASE_REQUIRED',
          status: HttpStatus.BAD_REQUEST,
        });
      }
    }
  }

  /**
   * 1:1 문의 운영 정책 조회 (미응답 감지 기준, 자동 종료 시간 등, 인메모리 및 CLS 캐시 적용)
   */
  async getInquiryPolicy(): Promise<InquiryPolicyConfig> {
    if (this.cls.isActive()) {
      const cached = this.cls.get<InquiryPolicyConfig>(CLS_SYSTEM_INQUIRY_POLICY);
      if (cached) return cached;
    }

    const now = Date.now();
    const cachedMemory = this.memoryCache.get('policy:inquiry');
    if (cachedMemory && cachedMemory.expiresAt > now) {
      const policy = cachedMemory.value as InquiryPolicyConfig;
      if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_INQUIRY_POLICY, policy);
      return policy;
    }

    const target = await this.getConfig<Partial<InquiryPolicyConfig>>(SystemConfigKey.INQUIRY);

    const policy: InquiryPolicyConfig = {
      unansweredThresholdMinutes: target!.unansweredThresholdMinutes!,
      autoCloseHours: target!.autoCloseHours!,
      notificationCooldownMinutes: (target as { notification: { cooldownMinutes: number } }).notification.cooldownMinutes,
    };

    this.memoryCache.set('policy:inquiry', { value: policy, expiresAt: now + SYSTEM_CONFIG_MEMORY_TTL_MS });
    if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_INQUIRY_POLICY, policy);
    return policy;
  }

  /**
   * 1:1 문의 알림 설정 조회
   */
  async getInquiryNotification(): Promise<InquiryNotificationConfig | null> {
    const inquiry = await this.getConfig<{ notification?: InquiryNotificationConfig }>(SystemConfigKey.INQUIRY);
    if (inquiry?.notification?.enabled !== false && inquiry?.notification?.webhookUrl && inquiry.notification.webhookUrl.trim().length > 0) {
      return {
        enabled: inquiry.notification.enabled,
        type: inquiry.notification.type,
        webhookUrl: inquiry.notification.webhookUrl.trim(),
      };
    }
    return null;
  }

  /**
   * 슬랙 웹훅 URL 조회
   */
  async getSlackWebhookUrl(): Promise<string> {
    const noti = await this.getInquiryNotification();
    return noti?.webhookUrl ?? '';
  }

  /**
   * OAuth 소셜 로그인 연동 설정 조회
   */
  async getOAuth(): Promise<OAuthConfigDto> {
    const raw = await this.getConfig<Record<string, unknown>>(SystemConfigKey.OAUTH);
    return plainToInstance(OAuthConfigDto, raw ?? {});
  }

  /**
   * 단일 설정 키 조회 (L1 로컬 인메모리 -> L2 Redis -> L3 DB 3계층 캐시)
   */
  async getConfig<T>(key: SystemConfigKey): Promise<T | null> {
    const now = Date.now();

    // 1. L1: 로컬 인메모리 캐시 확인 (0.001ms)
    const localCached = this.memoryCache.get(key);
    if (localCached && localCached.expiresAt > now) {
      return localCached.value as T;
    }

    const redisKey = `${SYSTEM_CONFIG_REDIS_PREFIX}${key}`;

    // 2. L2: Redis(KvStore) 캐시 확인 (1~2ms)
    try {
      const redisCached = await this.kvStore.get<T>(redisKey);
      if (typeof redisCached !== 'undefined' && redisCached !== null) {
        if (!this.isCurrentConfigCache(key, redisCached)) {
          // A deployment can leave an older config schema in Redis after a DB migration.
          // Never use that partial value as a live system policy.
          await this.kvStore.del(redisKey);
        }
        else {
          // L1 로컬 메모리에 동기화 후 반환 (DB 쿼리 생략)
          this.memoryCache.set(key, { value: redisCached, expiresAt: now + SYSTEM_CONFIG_MEMORY_TTL_MS });
          return redisCached;
        }
      }
    }
    catch {
      // Redis 장애 시 안전하게 DB로 폴백
    }

    // 3. L3: PostgreSQL DB 조회
    const entity = await this.em.findOne(SystemConfig, { key }, { filters: false });
    const val = (entity ? entity.value : null) as T;

    // L1 로컬 캐시 적재
    this.memoryCache.set(key, { value: val, expiresAt: now + SYSTEM_CONFIG_MEMORY_TTL_MS });

    // L2 Redis 캐시 적재 (24시간 TTL, 변경 시 이벤트 및 del로 즉시 무효화)
    if (entity) {
      this.kvStore.set(redisKey, val, SYSTEM_CONFIG_REDIS_TTL_SECONDS).catch(() => {});
    }

    return val;
  }

  private isCurrentConfigCache(key: SystemConfigKey, value: unknown): value is Record<string, unknown> {
    if (key !== SystemConfigKey.SECURITY || typeof value !== 'object' || value === null) return true;
    const security = value as {
      session?: Record<string, unknown>
      twoFactor?: Record<string, unknown>
      verification?: Record<string, unknown>
      oauthStateTtlMinutes?: unknown
    };
    const session = security.session;
    return Boolean(session) && typeof session === 'object'
      && Number.isFinite(Number(session.timeoutMinutes))
      && Number.isFinite(Number(session.rememberMeDays))
      && security.twoFactor?.challengeTtlMinutes !== undefined
      && security.verification?.emailChallengeExpiryMinutes !== undefined
      && security.verification?.passwordResetChallengeExpiryMinutes !== undefined
      && security.verification?.phoneChallengeExpiryMinutes !== undefined
      && security.oauthStateTtlMinutes !== undefined;
  }

  /**
   * 현재 요청의 클라이언트 IP 조회
   */
  getClientIp(): string | null {
    const req = this.requestContext.request;
    if (!req) return null;
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0];
      return firstIp ? firstIp.trim() : null;
    }
    return req.ip || req.socket?.remoteAddress || null;
  }

  private checkTemporaryMaintenance(m: MaintenanceConfigDto, now: Date): MaintenanceStatus | null {
    const temp = m.temporary;
    if (!temp?.enabled) {
      return null;
    }

    const message = temp.message || '';
    const startAt = temp.startAt;
    const endAt = temp.endAt;

    if (startAt && endAt) {
      const nowMs = now.getTime();
      const isActive = nowMs >= new Date(startAt).getTime() && nowMs < new Date(endAt).getTime();
      return isActive ? { isActive: true, message } : null;
    }

    if (startAt) {
      const isActive = now.getTime() >= new Date(startAt).getTime();
      return isActive ? { isActive: true, message } : null;
    }

    return { isActive: true, message };
  }

  private checkRecurringMaintenance(m: MaintenanceConfigDto, now: Date): MaintenanceStatus | null {
    const recurring = m.recurring;
    if (!recurring?.enabled) {
      return null;
    }

    const weekdayStr = kstDayFormatter.format(now);
    const weekday = WEEKDAY_MAP[weekdayStr] ?? 0;
    const daysOfWeek = recurring.daysOfWeek ?? [];
    if (!daysOfWeek.includes(weekday)) {
      return null;
    }

    const currentTime = kstTimeFormatter.format(now);
    const startTime = recurring.startTime || '';
    const endTime = recurring.endTime || '';
    const isActive = Boolean(startTime && endTime && currentTime >= startTime && currentTime < endTime);

    if (isActive) {
      const message = recurring.message || '';
      return { isActive: true, message };
    }

    return null;
  }
}
