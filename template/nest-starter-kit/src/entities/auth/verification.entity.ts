import type { Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { isBefore } from 'date-fns';

import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'verification' })
export class Verification extends BaseEntity {
  @Property({ type: String, length: 255 })
  identifier!: string;

  @Property({ type: String, length: 255 })
  value!: string;

  @Property({ type: Date })
  expiresAt!: Date;

  @Property({ persist: false })
  get isExpired(): Opt<boolean> {
    return isBefore(this.expiresAt, new Date());
  }
}
