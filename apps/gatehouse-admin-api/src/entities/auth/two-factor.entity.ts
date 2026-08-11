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

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;
}
