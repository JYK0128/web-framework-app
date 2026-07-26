import { createStart } from '@tanstack/react-start';

import { startMiddlewares } from '#core/server/middleware';

export const startInstance = createStart(() => ({
  requestMiddleware: startMiddlewares,
}));
