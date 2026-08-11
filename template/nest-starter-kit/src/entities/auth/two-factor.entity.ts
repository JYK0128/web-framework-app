import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { User } from './user.entity';

@Entity({ tableName: 'twoFactor' })
export class TwoFactor extends BaseEntity {
  @Property({ type: String })
  secret!: string;

  @Property({ type: String, nullable: true })
  backupCodes: Opt<string> | null = null;

  @Property({ type: Boolean, default: false })
  verified: Opt<boolean> = false;

  @Property({ type: 'integer', default: 0 })
  failedVerificationCount: Opt<number> = 0;

  @Property({ type: Date, nullable: true })
  lockedUntil: Opt<Date> | null = null;

  @Property({ persist: false })
  get isLocked(): Opt<boolean> {
    return !!this.lockedUntil && this.lockedUntil > new Date();
  }

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;
}
