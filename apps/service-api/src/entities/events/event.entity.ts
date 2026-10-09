import type { Opt } from '@mikro-orm/core';
import { Entity, Enum, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';
import { PublicationStatus } from '#/entities/notices/notice.entity';

@Entity({ tableName: 'event' })
export class Event extends BaseEntity {
  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'timestamptz' })
  startsAt!: Date;

  @Property({ type: 'timestamptz' })
  endsAt!: Date;

  @Property({ type: 'string', length: 500, nullable: true })
  imageUrl: string | null = null;

  @Property({ type: 'string', length: 500, nullable: true })
  linkUrl: string | null = null;

  @Enum(() => PublicationStatus)
  status: Opt<PublicationStatus> = PublicationStatus.draft;

  @Property({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;
}
