import { getMaintenanceMessage } from '@pkg/shared/common';
import { useEffect, useState } from 'react';

import { useSystemConfigsControllerListConfigsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import { NoticeBanner } from '#/components/notice-banner';
import { SYSTEM_CONFIG_REFRESH_INTERVAL_MS } from '#/configs/app.config';

export function MaintenanceNotice() {
  const query = useSystemConfigsControllerListConfigsV1({ query: { refetchInterval: SYSTEM_CONFIG_REFRESH_INTERVAL_MS, staleTime: SYSTEM_CONFIG_REFRESH_INTERVAL_MS } });
  const [now, setNow] = useState<Date>(() => new Date());
  const maintenance = query.data?.data.maintenance;
  const message = maintenance ? getMaintenanceMessage(maintenance, now) : undefined;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), SYSTEM_CONFIG_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  if (!message) return null;

  return (
    <div className="
      px-6 pt-4
      md:px-8
    "
    >
      <NoticeBanner tone="danger" title="서비스 점검">
        {message}
      </NoticeBanner>
    </div>
  );
}
