import { deleteCookie } from 'nitro/h3';

import { COOKIE_OPTIONS, SESSION_COOKIE } from '../../../session/constants';
import { clearSession } from '../../../session/storage.server';
import { createProxyHandler } from '../../../utils/proxy';

export default createProxyHandler(async (event, response, currentSessionId) => {
  if (!response.ok) return;

  await clearSession(currentSessionId);
  deleteCookie(event, SESSION_COOKIE, COOKIE_OPTIONS);
});
