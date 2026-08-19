import { createProxyHandler } from '../../utils/proxy';

export default createProxyHandler(undefined, undefined, { retryOnUnauthorized: true });
