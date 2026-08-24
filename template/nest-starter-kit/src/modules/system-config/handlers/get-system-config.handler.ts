import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SystemConfig as SystemConfigEntity } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetSystemConfigResponseDto, type HolidayItemDto, type MaintenanceWindowDto, OperatingHoursDto, OperatingStatusCode, OperatingStatusDto } from '#/modules/system-config/dto';
import { GetSystemConfigQuery } from '#/modules/system-config/queries/get-system-config.query';

// KST 날짜/시간 포맷터
const kstDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const kstTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
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

const kstDayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
});

@Injectable()
@QueryHandler(GetSystemConfigQuery)
export class GetSystemConfigHandler implements IQueryHandler<GetSystemConfigQuery, GetSystemConfigResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  async execute(): Promise<GetSystemConfigResponseDto> {
    // 1. identify: DB에서 설정 맵 로드
    const rawConfigs = await this.identifyConfigs();

    // 2. verify: 설정 파싱 및 기본값 보정
    const { maintenanceMode, maintenanceMessage, allowRegistration, operatingHours } = this.verifyConfigs(rawConfigs);

    // 3. process: KST 기준 실시간 운영 상태(OperatingStatus) 판정 및 Response DTO 생성
    const operatingStatus = this.processOperatingStatus(
      operatingHours,
      maintenanceMode,
      maintenanceMessage,
    );

    return this.processResponseDto({
      maintenanceMode,
      maintenanceMessage,
      allowRegistration,
      operatingHours,
      operatingStatus,
    });
  }

  /**
   * [1. identify] DB에서 시스템 설정 전체 로드
   */
  private async identifyConfigs(): Promise<Record<string, unknown>> {
    const entities = await this.em.find(SystemConfigEntity, {}, { filters: false });
    const dbMap: Record<string, unknown> = {};
    for (const ent of entities) {
      dbMap[ent.key] = ent.value;
    }
    return dbMap;
  }

  /**
   * [2. verify] 설정값 기본값 보정 (신규 8개 구조화 키 파싱)
   */
  private verifyConfigs(raw: Record<string, unknown>): {
    maintenanceMode: boolean
    maintenanceMessage: string
    allowRegistration: boolean
    operatingHours: OperatingHoursDto
  } {
    const rawEmergency = (raw['maintenance.emergency'] ?? {}) as Partial<{ enabled: boolean, message: string }>;
    const maintenanceMode = typeof rawEmergency.enabled === 'boolean'
      ? rawEmergency.enabled
      : false;
    const maintenanceMessage = typeof rawEmergency.message === 'string'
      ? rawEmergency.message
      : '시스템 점검 중입니다.';

    const rawAuth = (raw['auth.policy'] ?? {}) as Partial<{ allowRegistration: boolean }>;
    const allowRegistration = typeof rawAuth.allowRegistration === 'boolean'
      ? rawAuth.allowRegistration
      : true;

    const rawHours = (raw['operation.hours'] ?? {}) as Partial<OperatingHoursDto>;
    const rawHolidays = raw['operation.holidays'] as { items?: HolidayItemDto[] } | HolidayItemDto[] | undefined;
    let holidays: HolidayItemDto[] = [];
    if (Array.isArray(rawHolidays)) {
      holidays = rawHolidays;
    }
    else if (Array.isArray(rawHolidays?.items)) {
      holidays = rawHolidays.items;
    }

    const rawMessages = (raw['operation.messages'] ?? {}) as Partial<OperatingHoursDto['messages']>;
    const rawMaintenance = (raw['maintenance.scheduled'] ?? {}) as Partial<MaintenanceWindowDto>;

    const operatingHours: OperatingHoursDto = {
      start: rawHours.start ?? '09:00',
      end: rawHours.end ?? '18:00',
      openDays: rawHours.openDays ?? [1, 2, 3, 4, 5],
      lunchBreak: rawHours.lunchBreak ?? {
        enabled: false,
        start: '12:00',
        end: '13:00',
      },
      maintenance: {
        enabled: rawMaintenance.enabled ?? false,
        scheduledStartAt: rawMaintenance.scheduledStartAt ?? null,
        scheduledEndAt: rawMaintenance.scheduledEndAt ?? null,
      },

      holidays,
      messages: {
        lunch: rawMessages.lunch ?? '현재 점심시간(12:00 ~ 13:00)입니다. 문의를 남겨주시면 순차적으로 답변드리겠습니다.',
        offHours: rawMessages.offHours ?? '현재는 운영시간 외입니다. 남겨주신 문의는 다음 영업일 09:00부터 순차 처리됩니다.',
        holiday: rawMessages.holiday ?? '주말 및 공휴일은 고객센터 휴무입니다. 문의는 다음 영업일에 순차 답변드립니다.',
        maintenance: rawMessages.maintenance ?? '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.',
      },
    };

    return {
      maintenanceMode,
      maintenanceMessage,
      allowRegistration,
      operatingHours,
    };
  }

  /**
   * [3. process] KST 시계 기반 실시간 운영 상태 계산
   */
  private processOperatingStatus(
    operatingHours: OperatingHoursDto,
    emergencyMaintenance: boolean,
    emergencyMessage?: string,
    now: Date = new Date(),
  ): OperatingStatusDto {
    const {
      start,
      end,
      openDays,
      lunchBreak,
      maintenance,
      holidays,
      messages,
    } = operatingHours;

    // 1) 긴급 점검
    if (emergencyMaintenance) {
      return {
        isOpen: false,
        code: OperatingStatusCode.MAINTENANCE,
        message: emergencyMessage || messages.maintenance,
      };
    }

    // 2) 정기/예약 점검
    if (this.checkIsMaintenanceActive(now, maintenance)) {
      return {
        isOpen: false,
        code: OperatingStatusCode.MAINTENANCE,
        message: messages.maintenance,
      };
    }

    // 3) 공휴일/휴무일
    const formattedDate = kstDateFormatter.format(now);
    const isHoliday = holidays.some((h) => h.date === formattedDate);

    if (isHoliday) {
      return {
        isOpen: false,
        code: OperatingStatusCode.HOLIDAY,
        message: messages.holiday,
      };
    }

    // 4) 운영 요일
    const weekdayStr = kstDayFormatter.format(now);
    const weekday = WEEKDAY_MAP[weekdayStr] ?? 0;
    if (!openDays.includes(weekday)) {
      return {
        isOpen: false,
        code: OperatingStatusCode.WEEKEND,
        message: messages.holiday,
      };
    }

    // 5) 점심시간
    const currentTime = kstTimeFormatter.format(now);
    if (lunchBreak.enabled && currentTime >= lunchBreak.start && currentTime < lunchBreak.end) {
      return {
        isOpen: false,
        code: OperatingStatusCode.LUNCH_BREAK,
        message: messages.lunch,
      };
    }

    // 6) 기본 운영시간 외
    if (currentTime < start || currentTime >= end) {
      return {
        isOpen: false,
        code: OperatingStatusCode.CLOSED,
        message: messages.offHours,
      };
    }

    // 7) 정상 운영
    return {
      isOpen: true,
      code: OperatingStatusCode.OPEN,
      message: null,
    };
  }

  private checkIsMaintenanceActive(now: Date, maintenance: MaintenanceWindowDto): boolean {
    if (!maintenance.enabled) return false;

    // 1) 시작/종료 일시가 모두 지정된 경우: 해당 기간 동안만 점검 활성화
    if (maintenance.scheduledStartAt && maintenance.scheduledEndAt) {
      const startMs = new Date(maintenance.scheduledStartAt).getTime();
      const endMs = new Date(maintenance.scheduledEndAt).getTime();
      const nowMs = now.getTime();
      return nowMs >= startMs && nowMs < endMs;
    }

    // 2) 시작 일시만 지정된 경우: 시작 일시 이후부터 점검 활성화
    if (maintenance.scheduledStartAt) {
      const startMs = new Date(maintenance.scheduledStartAt).getTime();
      return now.getTime() >= startMs;
    }

    // 3) 일시 미지정 상태에서 enabled인 경우: 즉시 점검 활성화
    return true;
  }

  private processResponseDto(data: {
    maintenanceMode: boolean
    maintenanceMessage: string
    allowRegistration: boolean
    operatingHours: OperatingHoursDto
    operatingStatus: OperatingStatusDto
  }): GetSystemConfigResponseDto {
    const dto = new GetSystemConfigResponseDto();
    dto.maintenanceMode = data.maintenanceMode;
    dto.maintenanceMessage = data.maintenanceMessage;
    dto.allowRegistration = data.allowRegistration;
    dto.operatingHours = data.operatingHours;
    dto.operatingStatus = data.operatingStatus;
    return dto;
  }
}
