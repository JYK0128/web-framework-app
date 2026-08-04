import type { Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

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
  isTwoFactorAuthEnabled: Opt<boolean> = false;

  @Property({ type: String, nullable: true, hidden: true })
  twoFactorAuthSecret: Opt<string> | null = null;
}
