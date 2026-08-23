import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { ConfigCategory, SystemConfig } from '#/entities/system-config/system-config.entity';

const SYSTEM_CONFIG_SEEDS: ReadonlyArray<{
  key: string
  category: ConfigCategory
  value: unknown
  isPublic: boolean
  description: string
}> = [
  {
    key: 'operation.hours',
    category: ConfigCategory.OPERATION,
    value: {
      start: '09:00',
      end: '18:00',
      openDays: [1, 2, 3, 4, 5],
      lunchBreak: {
        enabled: false,
        start: '12:00',
        end: '13:00',
      },
    },
    isPublic: true,
    description: '고객센터 기본 운영 시간 및 요일, 점심시간 설정',
  },
  {
    key: 'operation.holidays',
    category: ConfigCategory.OPERATION,
    value: {
      items: [],
    },
    isPublic: true,
    description: '고객센터 법정공휴일 및 커스텀 휴무일 목록',
  },
  {
    key: 'operation.messages',
    category: ConfigCategory.OPERATION,
    value: {
      lunch: '현재 점심시간(12:00 ~ 13:00)입니다. 문의를 남겨주시면 순차적으로 답변드리겠습니다.',
      offHours: '현재는 운영시간 외입니다. 남겨주신 문의는 다음 영업일 09:00부터 순차 처리됩니다.',
      holiday: '주말 및 공휴일은 고객센터 휴무입니다. 문의는 다음 영업일에 순차 답변드립니다.',
      maintenance: '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.',
    },
    isPublic: true,
    description: '운영 상태별 사용자 안내 메시지 문구',
  },
  {
    key: 'maintenance.emergency',
    category: ConfigCategory.MAINTENANCE,
    value: {
      enabled: false,
      message: '시스템 점검 중입니다.',
    },
    isPublic: true,
    description: '긴급 시스템 점검 모드 활성화 여부 및 안내 문구',
  },
  {
    key: 'maintenance.scheduled',
    category: ConfigCategory.MAINTENANCE,
    value: {
      enabled: false,
      recurringDay: null,
      start: '02:00',
      end: '06:00',
      scheduledStartAt: null,
      scheduledEndAt: null,
    },
    isPublic: true,
    description: '정기/예약 시스템 점검 스케줄 설정',
  },
  {
    key: 'auth.policy',
    category: ConfigCategory.AUTH,
    value: {
      allowRegistration: true,
      loginFailureThreshold: 5,
      loginLockDurationMinutes: 15,
    },
    isPublic: true,
    description: '신규 회원가입 허용 여부 및 로그인 실패 계정 잠금 보안 정책',
  },
  {
    key: 'notification.slack',
    category: ConfigCategory.NOTIFICATION,
    value: {
      webhookUrl: '',
    },
    isPublic: false,
    description: '관리자 알림 수신용 슬랙 웹훅 설정',
  },
  {
    key: 'inquiry.policy',
    category: ConfigCategory.INQUIRY,
    value: {
      unansweredThresholdMinutes: 10,
    },
    isPublic: false,
    description: '미응답 문의 감지 및 슬랙 알림 발송 기준 시간 (분)',
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
          value: seed.value as Record<string, unknown>,
          isPublic: seed.isPublic,
          description: seed.description,
        });
      }
      else {
        config.value = seed.value as Record<string, unknown>;
        config.category = seed.category;
      }
    }
  }
}
