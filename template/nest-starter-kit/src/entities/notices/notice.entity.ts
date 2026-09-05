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

export const NoticeStatus = defineEnum('NoticeStatus', {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
} as const);

export type NoticeStatus = (typeof NoticeStatus)[keyof typeof NoticeStatus];

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
  get status(): Opt<NoticeStatus> {
    const now = new Date();
    if (this.publishedAt === null) return NoticeStatus.DRAFT;
    if (isAfter(this.publishedAt, now)) return NoticeStatus.SCHEDULED;
    if (this.expiresAt !== null && !isAfter(this.expiresAt, now)) return NoticeStatus.EXPIRED;
    return NoticeStatus.PUBLISHED;
  }

  @Property({ persist: false })
  get isPublished(): Opt<boolean> {
    return this.status === NoticeStatus.PUBLISHED;
  }
}
