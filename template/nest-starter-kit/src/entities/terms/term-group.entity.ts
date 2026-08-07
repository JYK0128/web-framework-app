import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { Term } from './term.entity';

@Entity({ tableName: 'term_group' })
export class TermGroup extends BaseEntity {
  @Property({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Property({ type: 'varchar', length: 255 })
  title!: string;

  @Property({ type: 'boolean', default: false })
  isRequired!: boolean;

  @Property({ type: 'integer', default: 0 })
  sortOrder: number = 0;

  @OneToMany(() => Term, (term) => term.termGroup)
  terms = new Collection<Term>(this);
}
