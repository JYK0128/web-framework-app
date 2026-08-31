import type { Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { isAfter } from 'date-fns';

import { defineEnum } from '#/common/dto/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const NoticePriority = defineEnum('NoticePriority', {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
} as const);

export type NoticePriority = (typeof NoticePriority)[keyof typeof NoticePriority];

@Entity({ tableName: 'notice' })
export class Notice extends BaseEntity {
  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'string', length: 10, default: NoticePriority.LOW })
  priority: Opt<NoticePriority> = NoticePriority.LOW;

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
