import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { plainToInstance } from 'class-transformer';
import { ClsService } from 'nestjs-cls';

import { SystemConfig, type SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store';
import { InquiryNotificationType, MaintenanceConfigDto, SecurityConfigDto } from '#/modules/system-config/dto';

import { RequestContext } from './request.context';

export interface AuthPolicyConfig {
  allowRegistration: boolean
  loginFailureThreshold: number
  loginLockDurationMinutes: number
  passwordExpirationDays: number
  sessionTimeoutMinutes: number
  preventConcurrentLogin: boolean
  minPasswordLength: number
  requireSpecialChar: boolean
}

export interface MaintenanceStatus {
  isActive: boolean
  message: string
}

export interface InquiryPolicyConfig {
  unansweredThresholdMinutes: number
  autoCloseHours: number
}

export interface InquiryNotificationConfig {
  enabled?: boolean
  type: InquiryNotificationType
  webhookUrl: string
}

const DEFAULT_AUTH_POLICY: AuthPolicyConfig = {
  allowRegistration: true,
  loginFailureThreshold: 5,
  loginLockDurationMinutes: 15,
  passwordExpirationDays: 90,
  sessionTimeoutMinutes: 30,
  preventConcurrentLogin: false,
  minPasswordLength: 8,
  requireSpecialChar: true,
};

const DEFAULT_INQUIRY_POLICY: InquiryPolicyConfig = {
  unansweredThresholdMinutes: 10,
  autoCloseHours: 72,
};

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
export class SystemContext {
  private readonly memoryCache = new Map<string, { value: unknown, expiresAt: number }>();
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5분 안전 로컬 메모리 TTL
  private readonly DEFAULT_REDIS_TTL_SEC = 24 * 60 * 60; // 24시간 Redis TTL (변경 시 즉시 del)

  constructor(
    private readonly cls: ClsService,
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly kvStore: KvStore,
  ) {}

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
      const allKeys: SystemConfigKey[] = ['operation', 'maintenance', 'security', 'inquiry'];
      await Promise.all(allKeys.map((k) => this.kvStore.del(`${SYSTEM_CONFIG_REDIS_PREFIX}${k}`)));
      return;
    }

    for (const key of keys) {
      this.memoryCache.delete(key);
      if (key === 'security') this.memoryCache.delete('policy:auth');
      if (key === 'inquiry') this.memoryCache.delete('policy:inquiry');
    }

    await Promise.all(
      keys.map((key) => this.kvStore.del(`${SYSTEM_CONFIG_REDIS_PREFIX}${key}`)),
    );
  }

  /**
   * 실시간 시스템 점검 활성화 여부 판정 (임시 점검 및 정기 점검 통합, 인메모리 및 CLS 캐시 적용)
   */
  async isMaintenanceActive(now: Date = new Date()): Promise<MaintenanceStatus> {
    if (this.cls.isActive()) {
      const cached = this.cls.get<MaintenanceStatus>(CLS_SYSTEM_MAINTENANCE);
      if (cached) return cached;
    }

    const raw = await this.getConfig<Record<string, unknown>>('maintenance');
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

    const target = (await this.getConfig<Record<string, unknown>>('security')) ?? {};
    const sec = plainToInstance(SecurityConfigDto, target);

    const policy: AuthPolicyConfig = {
      allowRegistration: sec.registration?.allowRegistration ?? DEFAULT_AUTH_POLICY.allowRegistration,
      loginFailureThreshold: sec.lockout?.maxFailureAttempts ?? DEFAULT_AUTH_POLICY.loginFailureThreshold,
      loginLockDurationMinutes: sec.lockout?.lockoutDurationMinutes ?? DEFAULT_AUTH_POLICY.loginLockDurationMinutes,
      passwordExpirationDays: sec.password?.expirationDays ?? DEFAULT_AUTH_POLICY.passwordExpirationDays,
      sessionTimeoutMinutes: sec.session?.sessionTimeoutMinutes ?? DEFAULT_AUTH_POLICY.sessionTimeoutMinutes,
      preventConcurrentLogin: sec.session?.preventConcurrentLogin ?? DEFAULT_AUTH_POLICY.preventConcurrentLogin,
      minPasswordLength: sec.password?.minLength ?? DEFAULT_AUTH_POLICY.minPasswordLength,
      requireSpecialChar: sec.password?.requireSpecialChar ?? DEFAULT_AUTH_POLICY.requireSpecialChar,
    };

    this.memoryCache.set('policy:auth', { value: policy, expiresAt: now + this.DEFAULT_TTL_MS });
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
   * 중복/동시 로그인 차단 활성화 여부
   */
  async isConcurrentLoginPrevented(): Promise<boolean> {
    const policy = await this.getAuthPolicy();
    return policy.preventConcurrentLogin;
  }

  /**
   * 세션 만료 시간 (분 단위)
   */
  async getSessionTimeoutMinutes(): Promise<number> {
    const policy = await this.getAuthPolicy();
    return policy.sessionTimeoutMinutes;
  }

  /**
   * 비밀번호 정책 검증 (최소 길이, 특수문자 필수 여부 등)
   */
  async validatePassword(password: string): Promise<void> {
    const policy = await this.getAuthPolicy();
    if (password.length < policy.minPasswordLength) {
      throw new ApplicationError({
        code: 'PASSWORD_TOO_SHORT',
        status: HttpStatus.BAD_REQUEST,
        params: { minLength: policy.minPasswordLength },
      });
    }

    if (policy.requireSpecialChar) {
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/;
      if (!specialCharRegex.test(password)) {
        throw new ApplicationError({
          code: 'PASSWORD_SPECIAL_CHAR_REQUIRED',
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

    const target = await this.getConfig<Partial<InquiryPolicyConfig>>('inquiry');

    const policy: InquiryPolicyConfig = {
      unansweredThresholdMinutes: target?.unansweredThresholdMinutes ?? DEFAULT_INQUIRY_POLICY.unansweredThresholdMinutes,
      autoCloseHours: target?.autoCloseHours ?? DEFAULT_INQUIRY_POLICY.autoCloseHours,
    };

    this.memoryCache.set('policy:inquiry', { value: policy, expiresAt: now + this.DEFAULT_TTL_MS });
    if (this.cls.isActive()) this.cls.set(CLS_SYSTEM_INQUIRY_POLICY, policy);
    return policy;
  }

  /**
   * 1:1 문의 알림 설정 조회
   */
  async getInquiryNotification(): Promise<InquiryNotificationConfig | null> {
    const inquiry = await this.getConfig<{ notification?: InquiryNotificationConfig }>('inquiry');
    if (inquiry?.notification?.enabled !== false && inquiry?.notification?.webhookUrl && inquiry.notification.webhookUrl.trim().length > 0) {
      return {
        enabled: inquiry.notification.enabled ?? true,
        type: inquiry.notification.type ?? InquiryNotificationType.SLACK,
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
        // L1 로컬 메모리에 동기화 후 반환 (DB 쿼리 생략)
        this.memoryCache.set(key, { value: redisCached, expiresAt: now + this.DEFAULT_TTL_MS });
        return redisCached;
      }
    }
    catch {
      // Redis 장애 시 안전하게 DB로 폴백
    }

    // 3. L3: PostgreSQL DB 조회
    const entity = await this.em.findOne(SystemConfig, { key }, { filters: false });
    const val = (entity ? entity.value : null) as T;

    // L1 로컬 캐시 적재
    this.memoryCache.set(key, { value: val, expiresAt: now + this.DEFAULT_TTL_MS });

    // L2 Redis 캐시 적재 (24시간 TTL, 변경 시 이벤트 및 del로 즉시 무효화)
    if (entity) {
      this.kvStore.set(redisKey, val, this.DEFAULT_REDIS_TTL_SEC).catch(() => {});
    }

    return val;
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

    const message = temp.message || '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.';
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
      const message = recurring.message || '정기 시스템 점검 시간입니다. 점검 시간 동안 서비스 이용이 일시 중단됩니다.';
      return { isActive: true, message };
    }

    return null;
  }
}
