import type { Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'resource' })
export class Resource extends BaseEntity {
  @Property({ type: 'string', length: 50, unique: true })
  key!: string;

  @Property({ type: 'string', length: 100 })
  label!: string;

  @Property({ type: 'string', length: 255, nullable: true })
  description: Opt<string> | null = null;

  @Property({ type: 'json' })
  actions: Opt<string[]> = ['create', 'read', 'update', 'delete'];

}
