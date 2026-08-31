import type { Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

import { Term } from './term.entity';

@Entity({ tableName: 'user_term_agreement' })
export class UserTermAgreement extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;

  @ManyToOne(() => Term, { deleteRule: 'cascade' })
  term!: Rel<Term>;

  /** 동의 또는 철회 상태입니다. */
  @Property({ type: 'boolean' })
  isAgreed!: boolean;
}
