import { isHoliday } from '@kokr/date';
import { format, getHours, isWeekend } from 'date-fns';

export interface OperatingHoursOptions {
  startHour?: number
  endHour?: number
}

/**
 * 현재 시각(KST 기준)이 서비스 운영 시간(평일 startHour ~ endHour, 법정/대체공휴일 제외)인지 확인합니다.
 */
export async function isOperatingHours(
  now: Date = new Date(),
  options: OperatingHoursOptions = {},
): Promise<boolean> {
  const { startHour = 9, endHour = 18 } = options;
  const kstOffsetMs = (9 * 60 + now.getTimezoneOffset()) * 60_000;
  const kstDate = new Date(now.getTime() + kstOffsetMs);

  // 1. 주말(토/일) 제외
  if (isWeekend(kstDate)) {
    return false;
  }

  // 2. 영업 시간 확인
  const hour = getHours(kstDate);
  if (hour < startHour || hour >= endHour) {
    return false;
  }

  // 3. 법정/대체공휴일 확인
  const formatted = format(kstDate, 'yyyy-MM-dd');
  const holiday = await isHoliday(formatted);
  if (holiday) {
    return false;
  }

  return true;
}
