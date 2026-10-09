import type { Opt } from '@mikro-orm/core';
import { Entity, Enum, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

export enum NoticeImportance {
  normal = 'normal',
  important = 'important',
  urgent = 'urgent',
}

export enum PublicationStatus {
  draft = 'draft',
  published = 'published',
}

@Entity({ tableName: 'notice' })
export class Notice extends BaseEntity {
  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Enum(() => NoticeImportance)
  importance: Opt<NoticeImportance> = NoticeImportance.normal;

  @Property({ type: 'boolean', default: false })
  isPinned: Opt<boolean> = false;

  @Enum(() => PublicationStatus)
  status: Opt<PublicationStatus> = PublicationStatus.draft;

  @Property({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;
}
