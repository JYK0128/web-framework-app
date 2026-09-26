import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'system_config' })
export class SystemConfig extends BaseEntity {
  @Property({ type: 'string', length: 100, unique: true })
  code!: string;

  @Property({ type: 'json' })
  value: unknown = {};

  @Property({ type: 'string', length: 255, nullable: true })
  description: string | null = null;
}
