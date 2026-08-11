import { Collection, type Opt } from '@mikro-orm/core';
import { Entity, OneToMany, Property } from '@mikro-orm/decorators/legacy';

import { Account } from '#/entities/auth/account.entity';
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
