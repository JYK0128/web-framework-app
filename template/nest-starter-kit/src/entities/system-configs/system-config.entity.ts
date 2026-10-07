import type { Opt } from '@mikro-orm/core';
import { Entity, Enum, Index, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const ConfigCategory = defineEnum('ConfigCategory', {
  OPERATION: 'OPERATION',
  MAINTENANCE: 'MAINTENANCE',
  SECURITY: 'SECURITY',
  INQUIRY: 'INQUIRY',
  NOTIFICATION: 'NOTIFICATION',
  OAUTH: 'OAUTH',
} as const);

export type ConfigCategory = (typeof ConfigCategory)[keyof typeof ConfigCategory];

export const SystemConfigKey = defineEnum('SystemConfigKey', {
  OPERATION: 'operation',
  MAINTENANCE: 'maintenance',
  SECURITY: 'security',
  INQUIRY: 'inquiry',
  NOTIFICATION: 'notification',
  OAUTH: 'oauth',
} as const);

export type SystemConfigKey = (typeof SystemConfigKey)[keyof typeof SystemConfigKey];

@Entity({ tableName: 'system_config' })
export class SystemConfig extends BaseEntity {
  @Index()
  @Enum({ items: () => SystemConfigKey, length: 100, unique: true })
  key!: SystemConfigKey;

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
