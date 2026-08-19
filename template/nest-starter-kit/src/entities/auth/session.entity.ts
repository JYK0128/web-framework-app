import { type Opt } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@pkg/shared/common';

/**
 * Better Auth-compatible session schema.
 *
 * The current authentication flow stores its active BFF session in Redis, but
 * this table is kept as the standard database session contract for future use.
 */
@Entity({ tableName: 'session' })
export class Session {
  @PrimaryKey({ type: String, onCreate: () => uuid() })
  id: Opt<string> = uuid();

  @Property({ type: String, length: 255 })
  userId!: string;

  @Property({ type: String, length: 255, unique: true })
  token!: string;

  @Property({ type: Date })
  expiresAt!: Date;

  @Property({ type: String, length: 255, nullable: true })
  ipAddress: Opt<string> | null = null;

  @Property({ type: 'text', nullable: true })
  userAgent: Opt<string> | null = null;

  @Property({ type: Date, onCreate: () => new Date() })
  createdAt: Opt<Date> = new Date();

  @Property({ type: Date, onCreate: () => new Date() })
  updatedAt: Opt<Date> = new Date();
}
