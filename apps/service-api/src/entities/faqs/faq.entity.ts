import type { Opt } from '@mikro-orm/core';
import { Entity, Enum, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';
import { ContentCategory } from '#/entities/common/content-category';

export const FaqCategory = ContentCategory;
export type FaqCategory = ContentCategory;

@Entity({ tableName: 'faq' })
export class Faq extends BaseEntity {
  @Enum(() => ContentCategory)
  category!: ContentCategory;

  @Property({ type: 'string', length: 255 })
  question!: string;

  @Property({ type: 'text' })
  answer!: string;

  @Property({ type: 'integer', default: 0 })
  sortOrder: Opt<number> = 0;

  @Property({ type: 'boolean', default: true })
  isPublished: Opt<boolean> = true;
}
