import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

import { Term } from './term.entity';

@Entity({ tableName: 'user_term_agreement' })
export class UserTermAgreement extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @ManyToOne(() => Term, { deleteRule: 'cascade' })
  term!: Term;

  @Property({ type: 'timestamp' })
  agreedAt!: Date;
}
