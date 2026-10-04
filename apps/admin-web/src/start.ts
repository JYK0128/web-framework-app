import { createStart } from '@tanstack/react-start';

import { i18nMiddleware } from './core/server/i18n-middleware';

export const startInstance = createStart(() => ({
  requestMiddleware: [i18nMiddleware],
}));
