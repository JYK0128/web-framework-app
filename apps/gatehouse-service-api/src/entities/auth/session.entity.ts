import type { Opt, Rel } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { User } from './user.entity';

@Embeddable()
export class SessionMetadata {
  [key: string]: unknown;

  @Property({ type: String, nullable: true })
  oauthState?: string | null;

  @Property({ type: 'json', nullable: true })
  clientContext?: Record<string, unknown> | null;
}

@Entity({ tableName: 'session' })
export class Session extends BaseEntity {
  @Embedded({ entity: () => SessionMetadata, object: true, nullable: true })
  override metadata: Opt<SessionMetadata> | null = null;

  @Property({ type: String, unique: true, length: 255 })
  token!: string;

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;

  @Property({ type: Date, nullable: true })
  expiresAt: Opt<Date> | null = null;

  @Property({ type: String, nullable: true })
  ipAddress: Opt<string> | null = null;

  @Property({ type: String, nullable: true })
  userAgent: Opt<string> | null = null;

  @Property({ persist: false })
  get isExpired(): Opt<boolean> {
    return Boolean(this.expiresAt && this.expiresAt < new Date());
  }
}
