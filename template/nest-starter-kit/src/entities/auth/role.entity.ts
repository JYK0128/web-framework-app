import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

export const ROLE_NAMES = {
  ANONYMOUS: 'anonymous',
  USER: 'user',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
export type RolePermissions = Record<string, string[]>;

@Entity({ tableName: 'role' })
export class Role extends BaseEntity {
  @Property({ type: 'varchar', length: 30, unique: true })
  name!: RoleName;

  @Property({ type: 'json' })
  permissions: RolePermissions = {};
}
