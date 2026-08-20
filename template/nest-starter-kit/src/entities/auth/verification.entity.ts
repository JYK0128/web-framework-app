import { type Opt } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@pkg/shared/common';

/**
 * Single-use verification data for OAuth state, 2FA challenges, and email codes.
 * Identifiers are hashed and values are encrypted before persistence.
 */
@Entity({ tableName: 'verification' })
export class Verification {
  @PrimaryKey({ type: String, onCreate: () => uuid() })
  id: Opt<string> = uuid();

  @Property({ type: String, length: 64, unique: true })
  identifier!: string;

  @Property({ type: 'text' })
  value!: string;

  @Property({ type: Date })
  expiresAt!: Date;

  @Property({ type: Date, onCreate: () => new Date() })
  createdAt: Opt<Date> = new Date();

  @Property({ type: Date, onCreate: () => new Date() })
  updatedAt: Opt<Date> = new Date();
}
