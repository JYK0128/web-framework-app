import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { ServiceSystemConfigCode } from '@pkg/shared/constants';
import { merge } from 'lodash-es';

import { SystemConfig } from '#/entities/system-configs/system-config.entity';

const DEFAULT_CONFIGS: Array<{ code: ServiceSystemConfigCode, description: string, value: Record<string, unknown> }> = [
  { code: ServiceSystemConfigCode.OPERATION, description: '고객센터 운영시간, 공휴일 목록, 운영 상태별 안내 메시지 설정', value: { hours: { start: '09:00', end: '18:00', openDays: [1, 2, 3, 4, 5], lunchBreak: { enabled: false, start: '12:00', end: '13:00' } }, holidays: [], messages: { lunch: '현재 점심시간(12:00 ~ 13:00)입니다. 문의를 남겨주시면 순차적으로 답변드리겠습니다.', offHours: '현재 고객지원 운영시간이 아니어서 답변이 어렵습니다. 운영시간에 확인 후 답변드리겠습니다.', holiday: '주말 및 공휴일은 고객센터 휴무입니다. 문의는 다음 영업일에 순차 답변드립니다.' } } },
  { code: ServiceSystemConfigCode.MAINTENANCE, description: '시스템 임시 및 정기 점검 설정', value: { temporary: { enabled: false, message: '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.', startAt: null, endAt: null }, recurring: { enabled: false, message: '정기 시스템 점검 시간입니다. 점검 시간 동안 서비스 이용이 일시 중단됩니다.', daysOfWeek: [4], startTime: '02:00', endTime: '04:00' } } },
  { code: ServiceSystemConfigCode.INQUIRY, description: '고객지원 첫 안내·부재중 응답 문구, 미응답 문의 감지 및 자동 종료 시간 설정', value: { customerGreeting: '안녕하세요! 무엇을 도와 드릴까요?\n궁금한 내용을 남겨 주시면 상담원이 확인해 드리겠습니다.', offlineReplyMessage: '현재 고객지원 운영시간이 아니어서 답변이 어렵습니다. 운영시간에 확인 후 답변드리겠습니다.', unansweredThresholdMinutes: 10, autoCloseHours: 72 } },
  { code: ServiceSystemConfigCode.WEBHOOK, description: '문의 운영자 알림 웹훅 설정', value: { enabled: false, type: 'SLACK', cooldownMinutes: 10, webhookUrl: '' } },
  { code: ServiceSystemConfigCode.DELIVERY, description: '이메일 SMTP, 비즈니스 메신저, SMS, 푸시 발송 채널 설정', value: { email: { from: '', smtp: { host: '', port: 587, secure: false, user: '', pass: '' } }, messenger: { enabled: false, provider: 'KAKAO' }, sms: { enabled: false, provider: 'NHN_SMS' }, push: { enabled: false, provider: 'FCM', fcm: { projectId: '', clientEmail: '', privateKey: '' } } } },
  {
    code: ServiceSystemConfigCode.OAUTH,
    description: 'OAuth 소셜 로그인 및 외부 인증 제공자 연동 설정',
    value: {
      google: { enabled: false, name: 'Google', clientId: '', clientSecret: '', authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth', tokenUrl: 'https://oauth2.googleapis.com/token', userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo', userIdPath: 'sub', emailPath: 'email', namePath: 'name', emailVerifiedPath: 'email_verified', scope: 'openid email profile', iconUrl: '/oauth-icons/google.png', brandColor: '#FFFFFF', brandTextColor: '#1F1F1F' },
      kakao: { enabled: false, name: 'Kakao', clientId: '', clientSecret: '', authorizeUrl: 'https://kauth.kakao.com/oauth/authorize', tokenUrl: 'https://kauth.kakao.com/oauth/token', userInfoUrl: 'https://kapi.kakao.com/v2/user/me', userIdPath: 'id', emailPath: 'kakao_account.email', namePath: 'properties.nickname', emailVerifiedPath: 'kakao_account.is_email_verified', scope: 'profile_nickname account_email', iconUrl: '/oauth-icons/kakao.png', brandColor: '#FEE500', brandTextColor: '#191919' },
      naver: { enabled: false, name: 'Naver', clientId: '', clientSecret: '', authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize', tokenUrl: 'https://nid.naver.com/oauth2.0/token', userInfoUrl: 'https://openapi.naver.com/v1/nid/me', userIdPath: 'response.id', emailPath: 'response.email', namePath: 'response.name', scope: 'email name', iconUrl: '/oauth-icons/naver.png', brandColor: '#03A94D', brandTextColor: '#FFFFFF' },
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
