import { Entity, Enum, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/schema/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const AdminSystemConfigCode = defineEnum('AdminSystemConfigCode', {
  EMAIL: 'email',
} as const);

export type AdminSystemConfigCode = (typeof AdminSystemConfigCode)[keyof typeof AdminSystemConfigCode];

@Entity({ tableName: 'system_config' })
export class SystemConfig extends BaseEntity {
  @Enum({ items: () => AdminSystemConfigCode, length: 100, unique: true })
  code!: AdminSystemConfigCode;

  @Property({ type: 'json' })
  value: unknown = {};

  @Property({ type: 'string', length: 255, nullable: true })
  description: string | null = null;
}
