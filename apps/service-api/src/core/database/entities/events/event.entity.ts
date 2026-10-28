import type { Opt } from '@mikro-orm/core';
import { Entity, Index, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '~/core/database/entities/base.entity';

export enum EventPhase {
  ongoing = 'ongoing',
  upcoming = 'upcoming',
  ended = 'ended',
}

@Entity({ tableName: 'event' })
@Index({ properties: ['publishedAt'] })
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

  @Property({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;

  @Property({ persist: false })
  get isDraft(): Opt<boolean> { return this.publishedAt === null; }

  @Property({ persist: false })
  get isScheduled(): Opt<boolean> { return this.publishedAt !== null && this.publishedAt.getTime() > Date.now(); }

  @Property({ persist: false })
  get isPublished(): Opt<boolean> { return this.publishedAt !== null && this.publishedAt.getTime() <= Date.now(); }

  @Property({ type: 'string', persist: false })
  get phase(): Opt<EventPhase> {
    const now = Date.now();
    if (this.endsAt.getTime() <= now) return EventPhase.ended;
    return this.startsAt.getTime() > now ? EventPhase.upcoming : EventPhase.ongoing;
  }
}
