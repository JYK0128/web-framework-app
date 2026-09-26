import type { Opt, Rel } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, ManyToOne, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import { isFuture } from '@pkg/shared/common';

import { Role } from '#/entities/auth.extensions/role.entity';
import { Profile } from '#/entities/auth/profile.entity';
import { BaseEntity } from '#/entities/common/base.entity';

@Embeddable()
export class UserMetadata {
  [key: string]: unknown;

  @Property({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date | null;

  @Property({ type: 'integer', nullable: true })
  failedLoginAttempts?: number | null;

  @Property({ type: 'timestamp', nullable: true })
  lockedUntil?: Date | null;
}

@Entity({ tableName: 'user' })
export class User extends BaseEntity {
  @Embedded({ entity: () => UserMetadata, object: true, nullable: true })
  override metadata: Opt<UserMetadata> | null = null;

  @Property({ type: 'string', length: 120 })
  name!: string;

  @Property({ type: 'text' })
  emailEncrypted!: string;

  @Property({ type: 'string', unique: true, length: 64 })
  emailHash!: string;

  @Property({ type: 'boolean', default: false })
  emailVerified: Opt<boolean> = false;

  @Property({ type: 'string', nullable: true })
  image: Opt<string> | null = null;

  @Property({ type: 'boolean', default: false })
  twoFactorEnabled: Opt<boolean> = false;

  @Property({ type: 'boolean', default: false })
  banned: Opt<boolean> = false;

  @Property({ type: 'string', nullable: true, length: 255 })
  banReason: Opt<string> | null = null;

  @Property({ type: 'timestamp', nullable: true })
  banExpires: Opt<Date> | null = null;

  @Property({ persist: false })
  get isBanned(): Opt<boolean> {
    return isFuture(this.banExpires);
  }

  @Property({ persist: false })
  get isLocked(): Opt<boolean> {
    return isFuture(this.metadata?.lockedUntil);
  }

  @Property({ persist: false })
  get isDeleted(): Opt<boolean> {
    return !!this.deletedAt;
  }

  @ManyToOne(() => Role, { nullable: true })
  role: Opt<Rel<Role>> | null = null;

  @OneToOne(() => Profile, (profile) => profile.user, { nullable: true })
  profile: Opt<Rel<Profile>> | null = null;
}
