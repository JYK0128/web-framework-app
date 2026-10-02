import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, OneToOne, Property } from '@mikro-orm/decorators/legacy';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'profile' })
export class Profile extends BaseEntity {
  @OneToOne(() => User, (user) => user.profile, { owner: true, unique: true })
  user!: Rel<User>;

  @Property({ type: 'string', length: 120 })
  name!: string;

  @Property({ type: 'text' })
  emailEncrypted!: string;

  @Property({ type: 'string', unique: true, length: 64 })
  emailHash!: string;

  @Property({ type: 'string', nullable: true })
  image: Opt<string> | null = null;

  @Property({ type: 'text', nullable: true })
  phoneNumberEncrypted: Opt<string> | null = null;

  @Property({ type: 'string', unique: true, nullable: true, length: 64 })
  phoneNumberHash: Opt<string> | null = null;

  @Property({ type: 'string', unique: true, nullable: true, length: 64 })
  ciHash: Opt<string> | null = null;

  @Property({ type: 'string', unique: true, nullable: true, length: 64 })
  diHash: Opt<string> | null = null;
}
