import 'express-session';

import type { UserPrincipal } from '#/core/types/principal.type';

declare module 'express-session' {
  interface SessionData {
    principal?: UserPrincipal
  }
}
