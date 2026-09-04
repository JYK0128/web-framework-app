import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import { SystemConfig as SystemConfigEntity } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AuthPolicyValueDto, GetSystemConfigResponseDto, OperatingHoursDto, OperatingHoursUpdateDto, OperatingMaintenanceDto, OperatingMessagesDto, OperatingStatusCode, OperatingStatusDto, OperationHolidaysResponseDto, SystemConfigValueMap } from '#/modules/system-config/dto';
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

type RawSystemConfigMap = Partial<SystemConfigValueMap>;

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
    const { allowRegistration, operatingHours } = this.verifyConfigs(rawConfigs);

    // 3. process: KST 기준 실시간 운영 상태(OperatingStatus) 판정 및 Response DTO 생성
    const operatingStatus = this.processOperatingStatus(operatingHours);
    const maintenanceMode = operatingStatus.code === OperatingStatusCode.MAINTENANCE;
    const maintenanceMessage = operatingStatus.message ?? operatingHours.maintenance.message;

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
  private async identifyConfigs(): Promise<RawSystemConfigMap> {
    const entities = await this.em.find(SystemConfigEntity, {}, { filters: false });
    const dbMap: RawSystemConfigMap = {};
    for (const ent of entities) {
      dbMap[ent.key] = ent.value as never;
    }
    return dbMap;
  }

  /**
   * [2. verify] 설정값 기본값 보정 (구조화 DTO 변환)
   */
  private verifyConfigs(raw: RawSystemConfigMap): {
    allowRegistration: boolean
    operatingHours: OperatingHoursDto
  } {
    const authPolicy = plainToInstance(AuthPolicyValueDto, raw['auth.policy'] ?? {});
    const allowRegistration = typeof authPolicy.allowRegistration === 'boolean'
      ? authPolicy.allowRegistration
      : true;

    const maintenance = plainToInstance(OperatingMaintenanceDto, raw.maintenance ?? {});
    if (!maintenance.message) {
      maintenance.message = '시스템 점검 중입니다.';
    }

    const hours = plainToInstance(OperatingHoursUpdateDto, raw['operation.hours'] ?? {});
    const holidaysDto = plainToInstance(OperationHolidaysResponseDto, raw['operation.holidays'] ?? { holidays: [] });
    const holidays = holidaysDto.holidays ?? [];

    const messages = plainToInstance(OperatingMessagesDto, raw['operation.messages'] ?? {});

    const operatingHours: OperatingHoursDto = {
      start: hours.start ?? '09:00',
      end: hours.end ?? '18:00',
      openDays: hours.openDays ?? [1, 2, 3, 4, 5],
      lunchBreak: hours.lunchBreak ?? {
        enabled: false,
        start: '12:00',
        end: '13:00',
      },
      maintenance: {
        enabled: maintenance.enabled ?? false,
        message: maintenance.message,
        scheduledStartAt: maintenance.scheduledStartAt ?? null,
        scheduledEndAt: maintenance.scheduledEndAt ?? null,
      },
      holidays,
      messages: {
        lunch: messages.lunch ?? '현재 점심시간(12:00 ~ 13:00)입니다. 문의를 남겨주시면 순차적으로 답변드리겠습니다.',
        offHours: messages.offHours ?? '현재는 운영시간 외입니다. 남겨주신 문의는 다음 영업일 09:00부터 순차 처리됩니다.',
        holiday: messages.holiday ?? '주말 및 공휴일은 고객센터 휴무입니다. 문의는 다음 영업일에 순차 답변드립니다.',
        maintenance: messages.maintenance ?? '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.',
      },
    };

    return {
      allowRegistration,
      operatingHours,
    };
  }

  /**
   * [3. process] KST 시계 기반 실시간 운영 상태 계산
   */
  private processOperatingStatus(
    operatingHours: OperatingHoursDto,
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

    // 1) 시스템 점검
    if (this.checkIsMaintenanceActive(now, maintenance)) {
      return {
        isOpen: false,
        code: OperatingStatusCode.MAINTENANCE,
        message: maintenance.message || messages.maintenance,
      };
    }

    // 2) 공휴일/휴무일
    const formattedDate = kstDateFormatter.format(now);
    const isHoliday = holidays.some((h) => h.date === formattedDate);

    if (isHoliday) {
      return {
        isOpen: false,
        code: OperatingStatusCode.HOLIDAY,
        message: messages.holiday,
      };
    }

    // 3) 운영 요일
    const weekdayStr = kstDayFormatter.format(now);
    const weekday = WEEKDAY_MAP[weekdayStr] ?? 0;
    if (!openDays.includes(weekday)) {
      return {
        isOpen: false,
        code: OperatingStatusCode.WEEKEND,
        message: messages.holiday,
      };
    }

    // 4) 점심시간
    const currentTime = kstTimeFormatter.format(now);
    if (lunchBreak.enabled && currentTime >= lunchBreak.start && currentTime < lunchBreak.end) {
      return {
        isOpen: false,
        code: OperatingStatusCode.LUNCH_BREAK,
        message: messages.lunch,
      };
    }

    // 5) 기본 운영시간 외
    if (currentTime < start || currentTime >= end) {
      return {
        isOpen: false,
        code: OperatingStatusCode.CLOSED,
        message: messages.offHours,
      };
    }

    // 6) 정상 운영
    return {
      isOpen: true,
      code: OperatingStatusCode.OPEN,
      message: null,
    };
  }

  private checkIsMaintenanceActive(now: Date, maintenance: OperatingMaintenanceDto): boolean {
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
