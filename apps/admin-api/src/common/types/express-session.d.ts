import 'express-session';

import type { UserPrincipal } from '#/common/types/principal.type';

declare module 'express-session' {
  interface SessionData {
    principal?: UserPrincipal
  }
}
