import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { SystemConfigKey } from '#/entities/system-configs/system-config.entity';
import { type GetSystemConfigResponseDto, MaintenanceConfigDto } from '#/modules/system-config/dto';
import type { PublicConfigContext, PublicConfigContributor } from '#/modules/system-config/registry';

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

const kstTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export interface MaintenanceCheckResult {
  isActive: boolean
  message: string
}

@Injectable()
export class MaintenancePublicConfigContributor implements PublicConfigContributor<unknown, MaintenanceConfigDto | undefined> {
  readonly key = SystemConfigKey.MAINTENANCE;

  verify(raw: unknown): MaintenanceConfigDto | undefined {
    return raw ? plainToInstance(MaintenanceConfigDto, raw) : undefined;
  }

  process(
    verified: MaintenanceConfigDto | undefined,
    context: PublicConfigContext,
    response: GetSystemConfigResponseDto,
  ): void {
    const check = this.checkIsMaintenanceActive(context.now, verified);
    response.maintenanceMode = check.isActive;
    response.maintenanceMessage = check.message || verified?.temporary?.message || '';
  }

  /**
   * 점검 활성화 여부 판정 (임시 점검 및 정기 점검)
   */
  checkIsMaintenanceActive(now: Date, maintenance?: MaintenanceConfigDto): MaintenanceCheckResult {
    if (!maintenance) {
      return { isActive: false, message: '' };
    }

    const tempCheck = this.checkTemporaryMaintenance(now, maintenance);
    if (tempCheck.isActive) {
      return tempCheck;
    }

    return this.checkRecurringMaintenance(now, maintenance);
  }

  private checkTemporaryMaintenance(now: Date, m: MaintenanceConfigDto): MaintenanceCheckResult {
    const temp = m.temporary;
    if (!temp?.enabled) return { isActive: false, message: '' };

    const startAt = temp.startAt || null;
    const endAt = temp.endAt || null;
    const message = temp.message || '';

    if (startAt && endAt) {
      const nowMs = now.getTime();
      const isActive = nowMs >= new Date(startAt).getTime() && nowMs < new Date(endAt).getTime();
      return { isActive, message: isActive ? message : '' };
    }

    if (startAt) {
      const isActive = now.getTime() >= new Date(startAt).getTime();
      return { isActive, message: isActive ? message : '' };
    }

    return { isActive: true, message };
  }

  private checkRecurringMaintenance(now: Date, m: MaintenanceConfigDto): MaintenanceCheckResult {
    const recurring = m.recurring;
    if (!recurring?.enabled) return { isActive: false, message: '' };

    const weekdayStr = kstDayFormatter.format(now);
    const weekday = WEEKDAY_MAP[weekdayStr] ?? 0;
    const daysOfWeek = Array.isArray(recurring.daysOfWeek) ? recurring.daysOfWeek : [];
    if (!daysOfWeek.includes(weekday)) return { isActive: false, message: '' };

    const currentTime = kstTimeFormatter.format(now);
    const startTime = recurring.startTime || '';
    const endTime = recurring.endTime || '';
    const isActive = Boolean(startTime && endTime && currentTime >= startTime && currentTime < endTime);
    const message = recurring.message || '';

    return { isActive, message: isActive ? message : '' };
  }
}
