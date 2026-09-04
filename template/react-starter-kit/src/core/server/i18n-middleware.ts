import { createMiddleware } from '@tanstack/react-start';

import { getServerI18n } from '#/core/isomorphic/i18n';

export const i18nMiddleware = createMiddleware().server(async ({ request, next }) => {
  const i18n = await getServerI18n(request);
  const result = await next({ context: { i18n, request } });

  const responseLanguage = i18n.resolvedLanguage ?? i18n.language;
  if (responseLanguage) {
    result.response.headers.set('Content-Language', responseLanguage);
  }

  return result;
});
