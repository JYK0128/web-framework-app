import { TimeUtil } from '@pkg/shared/common';
import axios from 'axios';

import { SECURITY_CONFIG } from '~/app.config';

/** Shared Axios instance for outbound HTTP integrations. */
export const httpClient = axios.create({
  validateStatus: () => true,
  timeout: TimeUtil.ms.second(SECURITY_CONFIG.integrations.httpRequestTimeoutSeconds),
});
