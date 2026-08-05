import { Collection, type Opt } from '@mikro-orm/core';
import { Entity, OneToMany, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export interface UserMetadata {
  [key: string]: unknown
}

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

  @Property({ type: 'json', nullable: true })
  override metadata: Opt<UserMetadata> | null = null;

  @OneToMany(() => UserTermAgreement, (agreement) => agreement.user)
  termAgreements = new Collection<UserTermAgreement>(this);
}
