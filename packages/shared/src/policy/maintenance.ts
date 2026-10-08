import { TZDate } from '@date-fns/tz';
import { format, getDay, subDays } from 'date-fns';

import { DEFAULT_TIMEZONE } from '../common/date';

export type MaintenanceSchedule = {
  temporary: { enabled: boolean, message: string, startAt: string | null, endAt: string | null }
  recurring: { enabled: boolean, message: string, daysOfWeek: number[], startTime: string, endTime: string }
};

export function getMaintenanceMessage(maintenance: MaintenanceSchedule, now: Date): string | undefined {
  const { temporary, recurring } = maintenance;
  if (temporary.enabled
    && (!temporary.startAt || now >= new Date(temporary.startAt))
    && (!temporary.endAt || now < new Date(temporary.endAt))) return temporary.message;

  if (recurring.enabled) {
    const localTime = TZDate.tz(DEFAULT_TIMEZONE, now);
    const time = format(localTime, 'HH:mm');
    const weekday = getDay(localTime);
    const isOvernight = recurring.startTime > recurring.endTime;
    const activeToday = recurring.daysOfWeek.includes(weekday)
      && (isOvernight ? time >= recurring.startTime : (time >= recurring.startTime && time < recurring.endTime));
    const activeFromPreviousDay = isOvernight
      && time < recurring.endTime
      && recurring.daysOfWeek.includes(getDay(subDays(localTime, 1)));
    if (activeToday || activeFromPreviousDay) return recurring.message;
  }

  return undefined;
}
