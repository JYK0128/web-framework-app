import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { isAfter } from 'date-fns';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'twoFactor' })
export class TwoFactor extends BaseEntity {
  @Property({ type: 'string' })
  secret!: string;

  @Property({ type: 'string', nullable: true })
  backupCodes: Opt<string> | null = null;

  @Property({ type: 'boolean', default: false })
  verified: Opt<boolean> = false;

  @Property({ type: 'integer', default: 0 })
  failedVerificationCount: Opt<number> = 0;

  @Property({ type: 'timestamp', nullable: true })
  lockedUntil: Opt<Date> | null = null;

  @Property({ persist: false })
  get isLocked(): Opt<boolean> {
    return !!this.lockedUntil && isAfter(this.lockedUntil, new Date());
  }

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;
}
