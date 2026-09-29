import 'express-session';

import type { UserPrincipal } from '#/common/auth/principal';

declare module 'express-session' {
  interface SessionData {
    principal?: UserPrincipal
  }
}
