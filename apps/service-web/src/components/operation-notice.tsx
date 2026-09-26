import { TZDate } from '@date-fns/tz';
import { format, getDay } from 'date-fns';
import { useEffect, useState } from 'react';

import { useSystemConfigsControllerListConfigsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import type { PublicOperationConfigDto } from '#/.generated/api/model';
import { NoticeBanner } from '#/components/notice-banner';

export function OperationNotice() {
  const query = useSystemConfigsControllerListConfigsV1({ query: { staleTime: 60_000 } });
  const [now, setNow] = useState<Date>(() => TZDate.tz('Asia/Seoul'));
  const operation = query.data?.data.operation;
  const message = operation ? getOperationNotice(operation, now) : null;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(TZDate.tz('Asia/Seoul')), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!query.isError && !message) return null;

  return (
    <NoticeBanner tone="warning" title={query.isError ? '운영시간 안내' : '고객센터 안내'} dismissible>
      {query.isError ? '현재 운영시간 정보를 불러오지 못했습니다.' : message}
    </NoticeBanner>
  );
}

function getOperationNotice(operation: PublicOperationConfigDto, now: Date): string | null {
  const localDate = format(now, 'yyyy-MM-dd');
  const currentTime = format(now, 'HH:mm');
  const weekday = getDay(now);
  const { hours, holidays, messages } = operation;

  if (holidays.some(({ date }) => date === localDate) || !hours.openDays.includes(weekday)) return messages.holiday;
  if (hours.lunchBreak.enabled && currentTime >= hours.lunchBreak.start && currentTime < hours.lunchBreak.end) return messages.lunch;
  if (currentTime < hours.start || currentTime >= hours.end) return messages.offHours;
  return null;
}
