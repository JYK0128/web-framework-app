import type { Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { isAfter } from 'date-fns';

import { BaseEntity } from '#/entities/common/base.entity';

export const NOTICE_PRIORITIES = [0, 1, 2] as const;
export type NoticePriority = (typeof NOTICE_PRIORITIES)[number];

@Entity({ tableName: 'notice' })
export class Notice extends BaseEntity {
  @Property({ type: 'varchar', length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'boolean', default: false })
  isPinned: Opt<boolean> = false;

  @Property({ type: 'integer', default: 0 })
  priority: Opt<NoticePriority> = 0;

  @Property({ type: 'timestamp', nullable: true })
  publishedAt: Opt<Date> | null = null;

  @Property({ type: 'timestamp', nullable: true })
  expiresAt: Opt<Date> | null = null;

  @Property({ persist: false })
  get isPublished(): Opt<boolean> {
    const now = new Date();
    return this.publishedAt !== null
      && !isAfter(this.publishedAt, now)
      && (this.expiresAt === null || isAfter(this.expiresAt, now));
  }
}
