import { Collection, type Opt } from '@mikro-orm/core';
import { Entity, OneToMany, Property } from '@mikro-orm/decorators/legacy';

import { Account } from '#/entities/auth/account.entity';
import { type RoleName } from '#/entities/auth/role.entity';
import { Session } from '#/entities/auth/session.entity';
import { TwoFactor } from '#/entities/auth/two-factor.entity';
import { BaseEntity } from '#/entities/common/base.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

@Entity({ tableName: 'user' })
export class User extends BaseEntity {
  @Property({ type: String, length: 120 })
  name!: string;

  @Property({ type: String, unique: true, length: 320 })
  email!: string;

  @Property({ type: Boolean, default: false })
  emailVerified: Opt<boolean> = false;

  @Property({ type: Boolean, default: false })
  isAnonymous: Opt<boolean> = false;

  @Property({ type: String, nullable: true })
  image: Opt<string> | null = null;

  @Property({ type: Boolean, default: false })
  twoFactorEnabled: Opt<boolean> = false;

  @Property({ type: Boolean, default: false })
  banned: Opt<boolean> = false;

  @Property({ type: String, nullable: true, length: 255 })
  banReason: Opt<string> | null = null;

  @Property({ type: Date, nullable: true })
  banExpires: Opt<Date> | null = null;

  @Property({ type: String, nullable: true, length: 30 })
  role: Opt<RoleName> | null = null;

  @Property({ persist: false })
  get isBanned(): Opt<boolean> {
    if (!this.banned) return false;
    return !this.banExpires || this.banExpires > new Date();
  }

  @Property({ persist: false })
  get isDeleted(): Opt<boolean> {
    return !!this.deletedAt;
  }

  @OneToMany(() => Session, (session) => session.user)
  sessions = new Collection<Session>(this);

  @OneToMany(() => Account, (account) => account.user)
  accounts = new Collection<Account>(this);

  @OneToMany(() => TwoFactor, (twoFactor) => twoFactor.user)
  twoFactors = new Collection<TwoFactor>(this);

  @OneToMany(() => UserTermAgreement, (agreement) => agreement.user)
  termAgreements = new Collection<UserTermAgreement>(this);
}
