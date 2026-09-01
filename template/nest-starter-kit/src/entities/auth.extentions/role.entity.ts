import type { Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const RoleName = defineEnum('RoleName', {
  USER: 'user',
  ADMIN: 'admin',
} as const);

export type RoleName = (typeof RoleName)[keyof typeof RoleName];
export type RolePermissions = Record<string, string[]>;

@Entity({ tableName: 'role' })
export class Role extends BaseEntity {
  @Property({ type: 'string', length: 30, unique: true })
  name!: RoleName;

  @Property({ type: 'json' })
  permissions: Opt<RolePermissions> = {};
}
