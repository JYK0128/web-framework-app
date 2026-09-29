import { getOperationNotice } from '@pkg/shared/common';
import { useEffect, useState } from 'react';

import { useSystemConfigsControllerGetConfigsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import { NoticeBanner } from '#/components/notice-banner';
import { SYSTEM_CONFIG_REFRESH_INTERVAL_MS } from '#/configs/app.config';

export function OperationNotice() {
  const query = useSystemConfigsControllerGetConfigsV1({ query: { refetchInterval: SYSTEM_CONFIG_REFRESH_INTERVAL_MS, staleTime: SYSTEM_CONFIG_REFRESH_INTERVAL_MS } });
  const [now, setNow] = useState<Date>(() => new Date());
  const operation = query.data?.data.operation;
  const message = operation ? getOperationNotice(operation, now) : null;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), SYSTEM_CONFIG_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  if (!query.isError && !message) return null;

  return (
    <NoticeBanner tone="warning" title={query.isError ? '운영시간 안내' : '고객센터 안내'} dismissible>
      {query.isError ? '현재 운영시간 정보를 불러오지 못했습니다.' : message}
    </NoticeBanner>
  );
}
