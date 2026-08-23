import type { Opt } from '@mikro-orm/core';
import { Entity, Enum, Index, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const ConfigCategory = defineEnum('ConfigCategory', {
  OPERATION: 'OPERATION',
  MAINTENANCE: 'MAINTENANCE',
  AUTH: 'AUTH',
  NOTIFICATION: 'NOTIFICATION',
  INQUIRY: 'INQUIRY',
} as const);

export type ConfigCategory = (typeof ConfigCategory)[keyof typeof ConfigCategory];

@Entity({ tableName: 'system_config' })
export class SystemConfig extends BaseEntity {
  @Index()
  @Property({ type: 'string', length: 100, unique: true })
  key!: string;

  @Enum(() => ConfigCategory)
  @Index()
  category!: ConfigCategory;

  @Property({ type: 'json' })
  value!: Record<string, unknown>;

  @Property({ type: 'boolean', default: false })
  isPublic: Opt<boolean> = false;

  @Property({ type: 'string', length: 255, nullable: true })
  description: Opt<string> | null = null;
}
