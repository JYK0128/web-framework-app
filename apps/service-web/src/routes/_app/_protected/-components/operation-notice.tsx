import { getOperationNotice } from '@pkg/shared/policy';
import { NoticeBanner } from '@pkg/web-core/application';
import { useEffect, useState } from 'react';

import { SYSTEM_CONFIG_REFRESH_INTERVAL_MS } from '~/app.config';
import { Route as RootRoute } from '~/routes/__root';

export function OperationNotice() {
  const { config } = RootRoute.useRouteContext();
  const [now, setNow] = useState<Date>(() => new Date());
  const operation = config?.operation;
  const message = operation ? getOperationNotice(operation, now) : null;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), SYSTEM_CONFIG_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div>
      {message
        ? (
          <NoticeBanner tone="warning" title="고객센터 안내" dismissible>
            {message}
          </NoticeBanner>
        )
        : null}
    </div>
  );
}
