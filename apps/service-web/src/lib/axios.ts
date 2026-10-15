import { createAxiosClient } from '@pkg/web-core/runtime/api-client';

import { SILENT_QUERY_PATHS } from '#/app.config';
import { getI18n } from '#/i18n/i18n';

export const axios = createAxiosClient({
  getI18n,
  silentQueryPaths: SILENT_QUERY_PATHS,
  getServerOrigin: () => process.env.APP_BASE_URL,
});

export default axios;
