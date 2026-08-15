import type { Opt, Rel } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { isAfter } from 'date-fns';

import { BaseEntity } from '#/entities/common/base.entity';

import { User } from './user.entity';

@Embeddable()
export class AccountMetadata {
  [key: string]: unknown;

  @Property({ type: 'integer', nullable: true })
  failedLoginAttempts?: number | null;

  @Property({ type: 'datetime', nullable: true })
  lockedUntil?: Date | null;

  @Property({ type: 'datetime', nullable: true })
  passwordUpdatedAt?: Date | null;

  @Property({ type: 'datetime', nullable: true })
  passwordChangeDeferredUntil?: Date | null;

  @Property({ type: Boolean, nullable: true })
  passwordResetRequired?: boolean | null;

  @Property({ type: 'json', nullable: true })
  passwordHistory?: string[] | null;
}

@Entity({ tableName: 'account' })
export class Account extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;

  @Property({ type: String, length: 255 })
  accountId!: string;

  @Property({ type: String, length: 255 })
  providerId!: string;

  @Property({ type: String, nullable: true })
  accessToken: Opt<string> | null = null;

  @Property({ type: String, nullable: true })
  refreshToken: Opt<string> | null = null;

  @Property({ type: Date, nullable: true })
  accessTokenExpiresAt: Opt<Date> | null = null;

  @Property({ type: Date, nullable: true })
  refreshTokenExpiresAt: Opt<Date> | null = null;

  @Property({ type: String, nullable: true })
  scope: Opt<string> | null = null;

  @Property({ type: String, nullable: true })
  idToken: Opt<string> | null = null;

  @Property({ type: String, nullable: true, hidden: true })
  password: Opt<string> | null = null;

  @Embedded({ entity: () => AccountMetadata, object: true, nullable: true })
  override metadata: Opt<AccountMetadata> | null = null;

  @Property({ persist: false })
  get isPasswordAccount(): Opt<boolean> {
    return this.providerId === 'credential';
  }

  @Property({ persist: false })
  get isLocked(): Opt<boolean> {
    const lockedUntil = this.metadata?.lockedUntil;
    return !!lockedUntil && isAfter(lockedUntil, new Date());
  }
}
