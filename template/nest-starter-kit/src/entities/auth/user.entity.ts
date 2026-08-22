import { Collection, type Opt } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, OneToMany, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import { isAfter } from 'date-fns';

import { type RoleName } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { UserIdentity } from '#/entities/auth/user-identity.entity';
import { BaseEntity } from '#/entities/common/base.entity';

@Embeddable()
export class UserMetadata {
  [key: string]: unknown;

  @Property({ type: Date, nullable: true })
  lastLoginAt?: Date | null;
}

@Entity({ tableName: 'user' })
export class User extends BaseEntity {
  @Embedded({ entity: () => UserMetadata, object: true, nullable: true })
  override metadata: Opt<UserMetadata> | null = null;

  @Property({ type: String, length: 120 })
  name!: string;

  @Property({ type: String, nullable: true })
  image: Opt<string> | null = null;

  @Property({ type: String, unique: true, length: 320 })
  email!: string;

  @Property({ type: Boolean, default: false })
  emailVerified: Opt<boolean> = false;

  @Property({ type: String, unique: true, nullable: true, length: 30 })
  phoneNumber: Opt<string> | null = null;

  @Property({ type: Boolean, default: false })
  phoneNumberVerified: Opt<boolean> = false;

  @Property({ type: Boolean, default: false })
  twoFactorEnabled: Opt<boolean> = false;

  @Property({ type: Boolean, default: false })
  banned: Opt<boolean> = false;

  @Property({ type: String, nullable: true, length: 255 })
  banReason: Opt<string> | null = null;

  @Property({ type: Date, nullable: true })
  banExpires: Opt<Date> | null = null;

  @Property({ persist: false })
  get isBanned(): Opt<boolean> {
    if (!this.banned) return false;
    return !this.banExpires || isAfter(this.banExpires, new Date());
  }

  @Property({ persist: false })
  get isDeleted(): Opt<boolean> {
    return !!this.deletedAt;
  }

  @OneToMany(() => Account, (account) => account.user)
  accounts = new Collection<Account>(this);

  @OneToOne(() => UserIdentity, (identity) => identity.user, { nullable: true })
  identity: Opt<UserIdentity> | null = null;

  @Property({ type: String, nullable: true, length: 30 })
  role: Opt<RoleName> | null = null;
}
