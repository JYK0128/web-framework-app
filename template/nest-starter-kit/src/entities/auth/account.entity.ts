import type { Opt } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { User } from './user.entity';

export interface AccountMetadata {
  failedLoginAttempts?: number
  lockedUntil?: string
  [key: string]: unknown
}

@Entity({ tableName: 'account' })
export class Account extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Property({ type: String, length: 255 })
  accountId!: string;

  @Property({ type: String, length: 255 })
  providerId!: string;

  @Property({ type: String, nullable: true })
  accessToken: Opt<string> | null = null;

  @Property({ type: String, nullable: true })
  refreshToken: Opt<string> | null = null;

  @Property({ type: Date, nullable: true })
  accessTokenExpiresAt: Opt<Date> | null = null;

  @Property({ type: Date, nullable: true })
  refreshTokenExpiresAt: Opt<Date> | null = null;

  @Property({ type: String, nullable: true })
  scope: Opt<string> | null = null;

  @Property({ type: String, nullable: true })
  idToken: Opt<string> | null = null;

  @Property({ type: String, nullable: true, hidden: true })
  password: Opt<string> | null = null;

  @Property({ type: 'json', nullable: true })
  override metadata: Opt<AccountMetadata> | null = null;
}
