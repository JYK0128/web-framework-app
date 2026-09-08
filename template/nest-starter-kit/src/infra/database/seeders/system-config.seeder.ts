import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { ConfigCategory, SystemConfig, SystemConfigKey } from '#/entities/system-config/system-config.entity';

function getSystemConfigSeeds(): Array<{
  key: SystemConfigKey
  category: ConfigCategory
  value: Record<string, unknown>
  isPublic: boolean
  description: string
}> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || '';

  return [
    {
      key: SystemConfigKey.OPERATION,
      category: ConfigCategory.OPERATION,
      value: {
        hours: {
          start: '09:00',
          end: '18:00',
          openDays: [1, 2, 3, 4, 5],
          lunchBreak: {
            enabled: false,
            start: '12:00',
            end: '13:00',
          },
        },
        holidays: [],
        messages: {
          lunch: '현재 점심시간(12:00 ~ 13:00)입니다. 문의를 남겨주시면 순차적으로 답변드리겠습니다.',
          offHours: '현재는 운영시간 외입니다. 남겨주신 문의는 다음 영업일 09:00부터 순차 처리됩니다.',
          holiday: '주말 및 공휴일은 고객센터 휴무입니다. 문의는 다음 영업일에 순차 답변드립니다.',
        },
      },
      isPublic: true,
      description: '고객센터 운영시간, 공휴일 목록, 운영 상태별 안내 메시지 설정',
    },
    {
      key: SystemConfigKey.MAINTENANCE,
      category: ConfigCategory.MAINTENANCE,
      value: {
        temporary: {
          enabled: false,
          message: '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.',
          startAt: null,
          endAt: null,
        },
        recurring: {
          enabled: false,
          message: '정기 시스템 점검 시간입니다. 점검 시간 동안 서비스 이용이 일시 중단됩니다.',
          daysOfWeek: [4],
          startTime: '02:00',
          endTime: '04:00',
        },
      },
      isPublic: true,
      description: '시스템 임시 및 정기 점검 설정',
    },
    {
      key: SystemConfigKey.SECURITY,
      category: ConfigCategory.SECURITY,
      value: {
        registration: {
          allowRegistration: true,
          allowPasswordRegistration: true,
          requireEmailVerification: true,
        },
        session: {
          preventConcurrentLogin: false,
          timeoutMinutes: 30,
          rememberMeDays: 30,
        },
        lockout: {
          maxFailureAttempts: 5,
          lockoutDurationMinutes: 15,
        },
        password: {
          expirationDays: 90,
          changeDeferDays: 30,
          minLength: 8,
          requireSpecialChar: true,
          requireNumbers: true,
          requireUppercase: false,
          historyLimit: 3,
        },
        twoFactor: {
          enforceAdmin2FA: false,
          allowUser2FA: true,
        },
      },
      isPublic: false,
      description: '신규 회원가입, 세션/로그인 보안, 계정 잠금, 비밀번호 및 2단계 인증 정책',
    },
    {
      key: SystemConfigKey.INQUIRY,
      category: ConfigCategory.INQUIRY,
      value: {
        unansweredThresholdMinutes: 10,
        autoCloseHours: 72,
        notification: {
          enabled: Boolean(slackWebhookUrl),
          type: 'SLACK',
          cooldownMinutes: 10,
          webhookUrl: slackWebhookUrl,
        },
      },
      isPublic: false,
      description: '미응답 문의 감지, 답변 완료 후 자동 종료 시간 및 관리자 알림 웹훅 설정',
    },
    {
      key: SystemConfigKey.NOTIFICATION,
      category: ConfigCategory.NOTIFICATION,
      value: {},
      isPublic: false,
      description: '대고객 4대 채널(이메일 SMTP, 카카오톡/메신저, SMS 문자, 웹 푸시) 발송 설정',
    },
    {
      key: SystemConfigKey.OAUTH,
      category: ConfigCategory.OAUTH,
      value: {
        google: {
          enabled: false,
          name: 'Google',
          clientId: '',
          clientSecret: '',
          authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
          revokeUrl: 'https://oauth2.googleapis.com/revoke',
          scope: 'openid email profile',
        },
        kakao: {
          enabled: false,
          name: 'Kakao',
          clientId: '',
          clientSecret: '',
          authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
          tokenUrl: 'https://kauth.kakao.com/oauth/token',
          userInfoUrl: 'https://kapi.kakao.com/v2/user/me',
          revokeUrl: 'https://kapi.kakao.com/v1/user/unlink',
          scope: 'profile_nickname account_email',
        },
        naver: {
          enabled: false,
          name: 'Naver',
          clientId: '',
          clientSecret: '',
          authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize',
          tokenUrl: 'https://nid.naver.com/oauth2.0/token',
          userInfoUrl: 'https://openapi.naver.com/v1/nid/me',
          scope: 'email name',
        },
        github: {
          enabled: false,
          name: 'GitHub',
          clientId: '',
          clientSecret: '',
          authorizeUrl: 'https://github.com/login/oauth/authorize',
          tokenUrl: 'https://github.com/login/oauth/access_token',
          userInfoUrl: 'https://api.github.com/user',
          scope: 'read:user user:email',
        },
      },
      isPublic: false,
      description: 'OAuth 소셜 로그인 및 외부 인증 제공자 연동 설정',
    },
  ];
}

export class SystemConfigSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const seeds = getSystemConfigSeeds();
    for (const seed of seeds) {
      let config = await em.findOne(SystemConfig, { key: seed.key });
      if (!config) {
        config = em.create(SystemConfig, {
          key: seed.key,
          category: seed.category,
          value: seed.value,
          isPublic: seed.isPublic,
          description: seed.description,
        });
        em.persist(config);
      }
      else {
        config.value = seed.value;
        config.category = seed.category;
      }
    }
    await em.flush();
  }
}
