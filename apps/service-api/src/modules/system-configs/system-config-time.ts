import { TZDate } from '@date-fns/tz';
import { DEFAULT_TIMEZONE } from '@pkg/shared/common';
import { format, getDay } from 'date-fns';

import type { SystemConfig } from './system.context';

function getLocalTime(now: Date): TZDate {
  return TZDate.tz(DEFAULT_TIMEZONE, now);
}

export function isWithinOperatingHours(operation: SystemConfig['operation'], now: Date): boolean {
  const { hours, holidays } = operation;
  const localTime = getLocalTime(now);

  if (holidays.some((holiday) => holiday.date === format(localTime, 'yyyy-MM-dd'))) return false;
  if (!hours.openDays.includes(getDay(localTime))) return false;

  const time = format(localTime, 'HH:mm');
  if (hours.lunchBreak.enabled && time >= hours.lunchBreak.start && time < hours.lunchBreak.end) return false;
  return time >= hours.start && time < hours.end;
}

export function getMaintenanceMessage(maintenance: SystemConfig['maintenance'], now: Date): string | undefined {
  const { temporary, recurring } = maintenance;
  if (temporary.enabled
    && (!temporary.startAt || now >= new Date(temporary.startAt))
    && (!temporary.endAt || now < new Date(temporary.endAt))) return temporary.message;

  if (recurring.enabled) {
    const localTime = getLocalTime(now);
    if (!recurring.daysOfWeek.includes(getDay(localTime))) return undefined;
    const time = format(localTime, 'HH:mm');
    if (time >= recurring.startTime && time < recurring.endTime) return recurring.message;
  }

  return undefined;
}
