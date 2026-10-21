import { createAxiosClient } from '@pkg/web-core/runtime';

import { SILENT_QUERY_PATHS } from '~/app.config';
import { getI18n } from '~/i18n/i18n';
import { serverEnvSchema } from '~/lib/server-env';

export const axios = createAxiosClient({
  getI18n,
  silentQueryPaths: SILENT_QUERY_PATHS,
  getServerOrigin: () => serverEnvSchema.shape.APP_BASE_URL.parse(process.env.APP_BASE_URL),
});

export default axios;
