import type { Opt } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { User } from './user.entity';

export interface SessionMetadata {
  [key: string]: unknown
}

@Entity({ tableName: 'session' })
export class Session extends BaseEntity {
  @Property({ type: String, unique: true, length: 255 })
  token!: string;

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Property({ type: Date })
  expiresAt!: Date;

  @Property({ type: String, nullable: true })
  ipAddress: Opt<string> | null = null;

  @Property({ type: String, nullable: true })
  userAgent: Opt<string> | null = null;

  @Property({ type: 'json', nullable: true })
  override metadata: Opt<SessionMetadata> | null = null;
}
