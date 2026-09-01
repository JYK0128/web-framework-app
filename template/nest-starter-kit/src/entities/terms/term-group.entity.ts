import { Collection, type Opt } from '@mikro-orm/core';
import { Entity, OneToMany, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { Term } from './term.entity';

@Entity({ tableName: 'term_group' })
export class TermGroup extends BaseEntity {
  @Property({ type: 'string', length: 50, unique: true })
  code!: string;

  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'boolean', default: false })
  isRequired: Opt<boolean> = false;

  @Property({ type: 'integer', default: 0 })
  sortOrder: Opt<number> = 0;

  @OneToMany(() => Term, (term) => term.termGroup)
  terms = new Collection<Term>(this);
}
