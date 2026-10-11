import 'express-session';

import type { UserPrincipal } from '#/core/http/types/principal.type';

declare module 'express-session' {
  interface SessionData {
    principal?: UserPrincipal
  }
}
