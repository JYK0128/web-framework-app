import { isHoliday } from '@kokr/date';
import { format, getHours, isWeekend } from 'date-fns';

export const ALERT_CRON = '*/5 * * * *';
export const ALERT_THRESHOLD_MINUTES = 10;
export const ALERT_COOLDOWN_MINUTES = 10;

export function getUnansweredAlertCooldownKey(inquiryId: string): string {
  return `inquiry:unanswered-alert:${inquiryId}`;
}

/** 관리자 마지막 답변 후 자동 종료까지의 시간 (72시간 = 3일) */
export const AUTO_CLOSE_HOURS = 72;

export const OPERATING_START_HOUR = 9; // 09:00 (KST)
export const OPERATING_END_HOUR = 18; // 18:00 (KST)

/**
 * 현재 시각(KST 기준)이 서비스 운영 시간(평일 09:00 ~ 18:00, 법정/대체공휴일 제외)인지 확인합니다.
 */
export async function isOperatingHours(now = new Date()): Promise<boolean> {
  const kstOffsetMs = (9 * 60 + now.getTimezoneOffset()) * 60_000;
  const kstDate = new Date(now.getTime() + kstOffsetMs);

  // 1. 주말(토/일) 제외 (date-fns)
  if (isWeekend(kstDate)) {
    return false;
  }

  // 2. 영업 시간(09:00 ~ 18:00) 확인 (date-fns)
  const hour = getHours(kstDate);
  if (hour < OPERATING_START_HOUR || hour >= OPERATING_END_HOUR) {
    return false;
  }

  // 법정/대체공휴일 확인
  const formatted = format(kstDate, 'yyyy-MM-dd');
  const holiday = await isHoliday(formatted);
  if (holiday) {
    return false;
  }

  return true;
}
