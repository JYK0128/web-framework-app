import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { SERVICE_SYSTEM_CONFIG_CODES, type ServiceSystemConfigCode } from '@pkg/shared/common';
import { merge } from 'lodash-es';

import { SystemConfig } from '#/entities/system-configs/system-config.entity';

const DEFAULT_CONFIGS: Array<{ code: ServiceSystemConfigCode, description: string, value: Record<string, unknown> }> = [
  { code: SERVICE_SYSTEM_CONFIG_CODES.OPERATION, description: '고객센터 운영시간, 공휴일 목록, 운영 상태별 안내 메시지 설정', value: { hours: { start: '09:00', end: '18:00', openDays: [1, 2, 3, 4, 5], lunchBreak: { enabled: false, start: '12:00', end: '13:00' } }, holidays: [], messages: { lunch: '현재 점심시간(12:00 ~ 13:00)입니다. 문의를 남겨주시면 순차적으로 답변드리겠습니다.', offHours: '현재는 운영시간 외입니다. 남겨주신 문의는 다음 영업일 09:00부터 순차 처리됩니다.', holiday: '주말 및 공휴일은 고객센터 휴무입니다. 문의는 다음 영업일에 순차 답변드립니다.' } } },
  { code: SERVICE_SYSTEM_CONFIG_CODES.MAINTENANCE, description: '시스템 임시 및 정기 점검 설정', value: { temporary: { enabled: false, message: '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.', startAt: null, endAt: null }, recurring: { enabled: false, message: '정기 시스템 점검 시간입니다. 점검 시간 동안 서비스 이용이 일시 중단됩니다.', daysOfWeek: [4], startTime: '02:00', endTime: '04:00' } } },
  { code: SERVICE_SYSTEM_CONFIG_CODES.SECURITY, description: '신규 회원가입, 세션/로그인 보안, 계정 잠금, 비밀번호 및 2단계 인증 정책', value: { registration: { allowRegistration: true, allowCredentialRegistration: true, requireEmailVerification: true }, session: { preventConcurrentLogin: false, timeoutMinutes: 30, rememberMeDays: 30 }, lockout: { maxFailureAttempts: 5, lockoutDurationMinutes: 15 }, password: { expirationDays: 90, changeDeferDays: 30, minLength: 8, requireSpecialChar: true, requireNumbers: true, requireUppercase: false, historyLimit: 3 }, twoFactor: { enforceAdmin2FA: false, allowUser2FA: true } } },
  { code: SERVICE_SYSTEM_CONFIG_CODES.INQUIRY, description: '미응답 문의 감지 및 답변 완료 후 자동 종료 시간 설정', value: { unansweredThresholdMinutes: 10, autoCloseHours: 72 } },
  { code: SERVICE_SYSTEM_CONFIG_CODES.WEBHOOK, description: '문의 운영자 알림 웹훅 설정', value: { enabled: false, type: 'SLACK', cooldownMinutes: 10, webhookUrl: '' } },
  { code: SERVICE_SYSTEM_CONFIG_CODES.DELIVERY, description: '이메일 SMTP, 비즈니스 메신저, SMS, 푸시 발송 채널 설정', value: { email: { from: '', smtp: { host: '', port: 587, secure: false, user: '', pass: '' } }, messenger: { enabled: false, provider: 'KAKAO' }, sms: { enabled: false, provider: 'NHN_SMS' }, push: { enabled: false, provider: 'FCM', fcm: { projectId: '', clientEmail: '', privateKey: '' } } } },
  {
    code: SERVICE_SYSTEM_CONFIG_CODES.OAUTH,
    description: 'OAuth 소셜 로그인 및 외부 인증 제공자 연동 설정',
    value: {
      google: { enabled: false, name: 'Google', clientId: '', clientSecret: '', authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth', tokenUrl: 'https://oauth2.googleapis.com/token', userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo', scope: 'openid email profile', iconUrl: '/oauth-icons/google.png', brandColor: '#FFFFFF', brandTextColor: '#1F1F1F' },
      kakao: { enabled: false, name: 'Kakao', clientId: '', clientSecret: '', authorizeUrl: 'https://kauth.kakao.com/oauth/authorize', tokenUrl: 'https://kauth.kakao.com/oauth/token', userInfoUrl: 'https://kapi.kakao.com/v2/user/me', scope: 'profile_nickname account_email', iconUrl: '/oauth-icons/kakao.png', brandColor: '#FEE500', brandTextColor: '#191919' },
      naver: { enabled: false, name: 'Naver', clientId: '', clientSecret: '', authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize', tokenUrl: 'https://nid.naver.com/oauth2.0/token', userInfoUrl: 'https://openapi.naver.com/v1/nid/me', scope: 'email name', iconUrl: '/oauth-icons/naver.png', brandColor: '#03A94D', brandTextColor: '#FFFFFF' },
    },
  },
];

export class SystemConfigSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const input of DEFAULT_CONFIGS) {
      const existing = await em.findOne(SystemConfig, { code: input.code }, { filters: false });
      if (existing) {
        existing.value = merge({}, input.value, existing.value as Record<string, unknown>);
        continue;
      }
      em.persist(em.create(SystemConfig, input));
    }
    await em.flush();
  }
}
