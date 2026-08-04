import { Query } from '@nestjs/cqrs';

import type { PublicUser } from '#/modules/auth/auth.types';

export class GetCurrentUserQuery extends Query<PublicUser | null> {
  constructor(public readonly token: string | null) {
    super();
  }
}
