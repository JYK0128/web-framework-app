import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { ConfigCategory, SystemConfig, type SystemConfigKey } from '#/entities/system-config/system-config.entity';

const SYSTEM_CONFIG_SEEDS: ReadonlyArray<{
  key: SystemConfigKey
  category: ConfigCategory
  value: Record<string, unknown>
  isPublic: boolean
  description: string
}> = [
  {
    key: 'operation',
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
    key: 'maintenance',
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
    key: 'security',
    category: ConfigCategory.SECURITY,
    value: {
      registration: {
        allowRegistration: true,
      },
      session: {
        sessionTimeoutMinutes: 30,
        preventConcurrentLogin: false,
      },
      lockout: {
        maxFailureAttempts: 5,
        lockoutDurationMinutes: 15,
      },
      password: {
        expirationDays: 90,
        minLength: 8,
        requireSpecialChar: true,
      },
    },
    isPublic: true,
    description: '신규 회원가입, 세션/로그인 보안, 계정 잠금 및 비밀번호 정책',
  },
  {
    key: 'inquiry',
    category: ConfigCategory.INQUIRY,
    value: {
      unansweredThresholdMinutes: 10,
      autoCloseHours: 72,
      notification: {
        enabled: false,
        type: 'SLACK',
        webhookUrl: '',
      },
    },
    isPublic: false,
    description: '미응답 문의 감지, 답변 완료 후 자동 종료 시간 및 관리자 알림 웹훅 설정',
  },
];

export class SystemConfigSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const seed of SYSTEM_CONFIG_SEEDS) {
      let config = await em.findOne(SystemConfig, { key: seed.key });
      if (!config) {
        config = em.create(SystemConfig, {
          key: seed.key,
          category: seed.category,
          value: seed.value,
          isPublic: seed.isPublic,
          description: seed.description,
        });
      }
      else {
        config.value = seed.value;
        config.category = seed.category;
      }
    }
  }
}
