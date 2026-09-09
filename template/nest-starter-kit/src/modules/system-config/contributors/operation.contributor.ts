import { Injectable } from '@nestjs/common';

import { SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { type GetSystemConfigResponseDto, OperatingHoursDto, OperatingStatusCode, OperatingStatusDto, type OperationConfigDto } from '#/modules/system-config/dto';
import type { PublicConfigContext, PublicConfigContributor } from '#/modules/system-config/registry';

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
export class OperationPublicConfigContributor implements PublicConfigContributor<unknown, OperatingHoursDto> {
  readonly key = SystemConfigKey.OPERATION;

  verify(raw: unknown): OperatingHoursDto {
    const op = raw as OperationConfigDto;
    return {
      ...op.hours,
      holidays: op.holidays,
      messages: op.messages,
    };
  }

  process(
    verified: OperatingHoursDto,
    context: PublicConfigContext,
    response: GetSystemConfigResponseDto,
  ): void {
    response.operatingHours = verified;
    response.operatingStatus = this.calculateOperatingStatus(
      verified,
      context.now,
      response.maintenanceMode,
      response.maintenanceMessage,
    );
  }

  calculateOperatingStatus(
    operatingHours: OperatingHoursDto,
    now: Date,
    isMaintenanceActive = false,
    maintenanceMessage?: string,
  ): OperatingStatusDto {
    // 1) 시스템 점검 활성화 여부
    if (isMaintenanceActive) {
      return {
        isOpen: false,
        code: OperatingStatusCode.MAINTENANCE,
        message: maintenanceMessage || '',
      };
    }

    const {
      start,
      end,
      openDays,
      lunchBreak,
      holidays,
      messages,
    } = operatingHours;

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
}
