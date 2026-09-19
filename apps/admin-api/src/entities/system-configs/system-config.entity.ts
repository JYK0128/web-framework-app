import { Entity, Enum, Index, Property } from '@mikro-orm/decorators/legacy';
import { cloneDeep, isPlainObject, set } from 'lodash-es';

import { defineEnum } from '#/common/schema/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const SystemConfigCode = defineEnum('SystemConfigCode', {
  OPERATION: 'operation',
  MAINTENANCE: 'maintenance',
  SECURITY: 'security',
  INQUIRY: 'inquiry',
  NOTIFICATION: 'notification',
  OAUTH: 'oauth',
} as const);

export type SystemConfigCode = (typeof SystemConfigCode)[keyof typeof SystemConfigCode];

@Entity({ tableName: 'system_config' })
export class SystemConfig extends BaseEntity {
  @Index()
  @Enum({ items: () => SystemConfigCode, length: 100, unique: true })
  code!: SystemConfigCode;

  @Property({ type: 'json' })
  value: unknown = {};

  @Property({ type: 'string', length: 255, nullable: true })
  description: string | null = null;

  updateValue(patchOrPath: Record<string, unknown> | string, val?: unknown): void {
    if (typeof patchOrPath === 'string') {
      const current = isPlainObject(this.value) ? cloneDeep(this.value as Record<string, unknown>) : {};
      set(current, patchOrPath, val);
      this.value = current;
      return;
    }

    const current = isPlainObject(this.value) ? (this.value as Record<string, unknown>) : {};
    this.value = {
      ...current,
      ...patchOrPath,
    };
  }
}
