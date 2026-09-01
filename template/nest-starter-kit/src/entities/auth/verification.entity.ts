import { type Opt } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@pkg/shared/common';

/**
 * Single-use verification data for OAuth state, 2FA challenges, and email codes.
 * Identifiers are hashed and values are encrypted before persistence.
 */
@Entity({ tableName: 'verification' })
export class Verification {
  @PrimaryKey({ type: 'string', onCreate: () => uuid() })
  id: Opt<string> = uuid();

  @Property({ type: 'string', length: 64, unique: true })
  identifier!: string;

  @Property({ type: 'text' })
  value!: string;

  @Property({ type: 'timestamp' })
  expiresAt!: Date;

  @Property({ type: 'timestamp', onCreate: () => new Date() })
  createdAt: Opt<Date> = new Date();

  @Property({ type: 'timestamp', onCreate: () => new Date() })
  updatedAt: Opt<Date> = new Date();
}
