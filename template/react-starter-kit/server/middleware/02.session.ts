import { defineEventHandler, deleteCookie, getCookie, getRequestURL, setCookie } from 'nitro/h3';

import { getEnv } from '../env';
import { AUTH_REFRESH_PATH, COOKIE_OPTIONS, SESSION_COOKIE } from '../session/constants';
import { getSession } from '../session/storage.server';
import { getActiveSession } from '../utils/session';

export default defineEventHandler(async (event) => {
  const requestUrl = getRequestURL(event);
  if (!requestUrl.pathname.startsWith('/api/v1/')) return;
  if (requestUrl.pathname === AUTH_REFRESH_PATH) return;

  const backendUrl = getEnv().BACKEND_URL.replace(/\/$/, '');
  const sessionId = getCookie(event, SESSION_COOKIE);
  const session = await getSession(sessionId);

  const activeSession = await getActiveSession(backendUrl, sessionId, session);
  if (!activeSession) {
    if (sessionId && session) deleteCookie(event, SESSION_COOKIE, COOKIE_OPTIONS);
    return;
  }

  setCookie(event, SESSION_COOKIE, sessionId!, COOKIE_OPTIONS);
  event.context.accessToken = activeSession.accessToken;
});
