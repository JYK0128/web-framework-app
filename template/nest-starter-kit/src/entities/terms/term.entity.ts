import { Collection, type Opt, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/legacy';
import { isAfter } from 'date-fns';

import { BaseEntity } from '#/entities/common/base.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

import { TermGroup } from './term-group.entity';

@Entity({ tableName: 'term' })
export class Term extends BaseEntity {
  @ManyToOne(() => TermGroup, { deleteRule: 'cascade' })
  termGroup!: Rel<TermGroup>;

  @Property({ type: 'varchar', length: 50 })
  version!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'timestamp', nullable: true })
  publishedAt: Opt<Date> | null = null;

  @Property({ persist: false })
  get isPublished(): Opt<boolean> {
    return this.publishedAt !== null && !isAfter(this.publishedAt, new Date());
  }

  @Property({ persist: false })
  get isDraft(): Opt<boolean> {
    return this.publishedAt === null || isAfter(this.publishedAt, new Date());
  }

  @OneToMany(() => UserTermAgreement, (agreement) => agreement.term)
  agreements = new Collection<UserTermAgreement>(this);
}
