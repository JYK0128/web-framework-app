import type { Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const RoleKey = defineEnum('RoleKey', {
  USER: 'user',
  ADMIN: 'admin',
} as const);

export type RoleKey = (typeof RoleKey)[keyof typeof RoleKey] | (string & {});
/** @deprecated Use RoleKey in new code. */
export type RolePermissions = Record<string, string[]>;

@Entity({ tableName: 'role' })
export class Role extends BaseEntity {
  @Property({ type: 'string', length: 50, unique: true })
  key!: string;

  @Property({ type: 'string', length: 100, nullable: true })
  label: Opt<string> | null = null;

  @Property({ type: 'string', length: 255, nullable: true })
  description: Opt<string> | null = null;

  @Property({ type: 'boolean', default: false })
  isSystem: Opt<boolean> = false;

  @Property({ type: 'json' })
  permissions: Opt<RolePermissions> = {};
}
