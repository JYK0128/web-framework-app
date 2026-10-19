import { TZDate } from '@date-fns/tz';
import { format, getDay, subDays } from 'date-fns';

import { DEFAULT_TIMEZONE } from '../common/date';

export type OperatingSchedule = {
  hours: {
    start: string
    end: string
    openDays: number[]
    lunchBreak: { enabled: boolean, start: string, end: string }
  }
  holidays: { date: string }[]
  messages: { lunch: string, offHours: string, holiday: string }
};

export type OperationStatus = 'OPEN' | 'LUNCH' | 'OFF_HOURS' | 'HOLIDAY';

export function getOperationStatus(operation: OperatingSchedule, now: Date): OperationStatus {
  const { hours, holidays } = operation;
  const localTime = TZDate.tz(DEFAULT_TIMEZONE, now);
  const time = format(localTime, 'HH:mm');
  const weekday = getDay(localTime);
  const today = format(localTime, 'yyyy-MM-dd');
  const previousDay = subDays(localTime, 1);
  const previousDate = format(previousDay, 'yyyy-MM-dd');
  const previousWeekday = getDay(previousDay);

  if (holidays.some((holiday) => holiday.date === today)) return 'HOLIDAY';

  const overnightContinuation = hours.start > hours.end
    && time < hours.end
    && hours.openDays.includes(previousWeekday)
    && !holidays.some((holiday) => holiday.date === previousDate);
  const operatingDay = hours.openDays.includes(weekday) || overnightContinuation;
  if (!operatingDay) return 'HOLIDAY';

  const withinTodaysHours = hours.start > hours.end
    ? time >= hours.start
    : isWithinTimeRange(time, hours.start, hours.end);
  const openNow = overnightContinuation || (hours.openDays.includes(weekday) && withinTodaysHours);
  if (!openNow) return 'OFF_HOURS';
  if (hours.lunchBreak.enabled && isWithinTimeRange(time, hours.lunchBreak.start, hours.lunchBreak.end)) return 'LUNCH';
  return 'OPEN';
}

export function isWithinOperatingHours(operation: OperatingSchedule, now: Date): boolean {
  return getOperationStatus(operation, now) === 'OPEN';
}

export function getOperationNotice(operation: OperatingSchedule, now: Date): string | null {
  const status = getOperationStatus(operation, now);
  switch (status) {
    case 'OPEN': return null;
    case 'LUNCH': return operation.messages.lunch;
    case 'OFF_HOURS': return operation.messages.offHours;
    case 'HOLIDAY': return operation.messages.holiday;
  }
}

function isWithinTimeRange(time: string, start: string, end: string): boolean {
  if (start === end) return false;
  return start < end ? time >= start && time < end : time >= start || time < end;
}
