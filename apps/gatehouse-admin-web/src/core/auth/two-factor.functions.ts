import { createServerFn } from '@tanstack/react-start';
import { getCookie, setResponseHeaders } from '@tanstack/react-start/server';

const TWO_FACTOR_COOKIE_NAME = '9aRkL';

export const hasTwoFactorChallenge = createServerFn({ method: 'GET' }).handler(() => {
  setResponseHeaders(new Headers({ 'Cache-Control': 'private, no-store' }));

  return Boolean(getCookie(TWO_FACTOR_COOKIE_NAME));
});
