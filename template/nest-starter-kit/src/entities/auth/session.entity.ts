import { type Opt, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@pkg/shared/common';

import { User } from './user.entity';

/** Database-backed express-session record. */
@Entity({ tableName: 'session' })
export class Session {
  @PrimaryKey({ type: String, onCreate: () => uuid() })
  id: Opt<string> = uuid();

  @ManyToOne(() => User, { fieldName: 'userId', deleteRule: 'cascade' })
  user!: Rel<User>;

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

  @Property({ type: Date, onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Opt<Date> = new Date();
}
