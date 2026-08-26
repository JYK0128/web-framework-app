import type { Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'faq' })
export class Faq extends BaseEntity {
  @Property({ type: 'string', length: 50 })
  category!: string;

  @Property({ type: 'string', length: 255 })
  question!: string;

  @Property({ type: 'text' })
  answer!: string;

  @Property({ type: 'integer', default: 0 })
  order: Opt<number> = 0;

  @Property({ type: 'boolean', default: true })
  isPublished: Opt<boolean> = true;
}
