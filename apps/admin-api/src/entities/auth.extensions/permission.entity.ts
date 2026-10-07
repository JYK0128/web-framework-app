import { type Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'permission' })
export class Permission extends BaseEntity {
  @Property({ type: 'string', length: 120, unique: true })
  code!: string;

  @Property({ type: 'string', length: 100 })
  label!: string;

  @Property({ type: 'string', length: 255, nullable: true })
  description: Opt<string> | null = null;
}
