import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@pkg/shared/common';

import { User } from './user.entity';

@Entity({ tableName: 'refresh_token' })
export class RefreshToken {
  @PrimaryKey({ type: 'string', onCreate: () => uuid() })
  id: Opt<string> = uuid();

  @ManyToOne(() => User, { fieldName: 'userId', deleteRule: 'cascade' })
  user!: Rel<User>;

  @Property({ type: 'string', length: 64, unique: true })
  tokenHash!: string;

  @Property({ type: 'string', length: 255 })
  familyId!: string;

  @Property({ type: 'boolean' })
  rememberMe!: boolean;

  @Property({ type: 'timestamp' })
  expiresAt!: Date;

  @Property({ type: 'timestamp', nullable: true })
  usedAt: Opt<Date> | null = null;

  @Property({ type: 'timestamp', nullable: true })
  revokedAt: Opt<Date> | null = null;

  @Property({ type: 'timestamp', onCreate: () => new Date() })
  createdAt: Opt<Date> = new Date();
}
