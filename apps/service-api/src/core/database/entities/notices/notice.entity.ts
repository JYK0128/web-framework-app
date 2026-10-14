import type { Opt } from '@mikro-orm/core';
import { Entity, Enum, Index, Property } from '@mikro-orm/decorators/legacy';
import { NoticeImportance } from '@pkg/shared/constants';

import { BaseEntity } from '#/core/database/entities/base.entity';

@Entity({ tableName: 'notice' })
@Index({ properties: ['publishedAt'] })
export class Notice extends BaseEntity {
  @Property({ type: 'integer', formula: (columns) => `case ${columns.toString()}."importance" when 'urgent' then 0 when 'important' then 1 else 2 end` })
  importanceOrder!: Opt<number>;

  // Numeric timestamps preserve database precision; undated notices sort last with a non-null cursor key.
  @Property({ type: 'double', formula: (columns) => `coalesce(extract(epoch from ${columns.toString()}."publishedAt")::double precision, -9007199254740991::double precision)` })
  publicationOrder!: Opt<number>;

  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Enum(() => NoticeImportance)
  importance: Opt<NoticeImportance> = NoticeImportance.NORMAL;

  @Property({ type: 'boolean', default: false })
  isPinned: Opt<boolean> = false;

  @Property({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;

  @Property({ persist: false })
  get isDraft(): Opt<boolean> {
    return this.publishedAt === null;
  }

  @Property({ persist: false })
  get isScheduled(): Opt<boolean> {
    return this.publishedAt !== null && this.publishedAt.getTime() > Date.now();
  }

  @Property({ persist: false })
  get isPublished(): Opt<boolean> {
    return this.publishedAt !== null && this.publishedAt.getTime() <= Date.now();
  }
}
