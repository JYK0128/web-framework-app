import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { User } from './user.entity';

@Entity({ tableName: 'account' })
export class Account extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Property({ type: String, length: 255 })
  accountId!: string;

  @Property({ type: String, length: 255 })
  providerId!: string;

  @Property({ type: String, nullable: true })
  accessToken: string | null = null;

  @Property({ type: String, nullable: true })
  refreshToken: string | null = null;

  @Property({ type: Date, nullable: true })
  accessTokenExpiresAt: Date | null = null;

  @Property({ type: Date, nullable: true })
  refreshTokenExpiresAt: Date | null = null;

  @Property({ type: String, nullable: true })
  scope: string | null = null;

  @Property({ type: String, nullable: true })
  idToken: string | null = null;

  @Property({ type: String, nullable: true, hidden: true })
  password: string | null = null;
}
