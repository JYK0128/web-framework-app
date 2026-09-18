import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, OneToOne, Property } from '@mikro-orm/decorators/legacy';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'profile' })
export class Profile extends BaseEntity {
  @OneToOne(() => User, (user) => user.profile, { owner: true, unique: true })
  user!: Rel<User>;

  @Property({ type: 'string', unique: true, nullable: true, length: 50 })
  employeeNo: Opt<string> | null = null;

  @Property({ type: 'string', nullable: true, length: 100 })
  department: Opt<string> | null = null;

  @Property({ type: 'string', unique: true, nullable: true, length: 30 })
  phoneNumber: Opt<string> | null = null;
}
