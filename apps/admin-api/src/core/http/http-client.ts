import { TimeUtil } from '@pkg/shared/common';
import axios from 'axios';

import { SECURITY_CONFIG } from '#/app.config';

export const HTTP_REQUEST_TIMEOUT_MS = TimeUtil.ms.second(SECURITY_CONFIG.integrations.httpRequestTimeoutSeconds);
/** Shared Axios instance for outbound HTTP integrations. */
export const httpClient = axios.create({
  validateStatus: () => true,
  timeout: HTTP_REQUEST_TIMEOUT_MS,
});
