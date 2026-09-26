import { Entity, Enum, Index, Property } from '@mikro-orm/decorators/legacy';
import { SYSTEM_CONFIG_CODES, type SystemConfigCode } from '@pkg/shared/common';

import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'system_config' })
export class SystemConfig extends BaseEntity {
  @Index()
  @Enum({ items: () => SYSTEM_CONFIG_CODES, length: 100, unique: true })
  code!: SystemConfigCode;

  @Property({ type: 'json' })
  value: unknown = {};

  @Property({ type: 'string', length: 255, nullable: true })
  description: string | null = null;
}
