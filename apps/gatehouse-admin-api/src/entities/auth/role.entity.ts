import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

export const ROLE_NAMES = {
  ANONYMOUS: 'anonymous',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
} as const;

export type SystemRoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
export type RoleName = SystemRoleName | 'user';
export type RolePermissions = Record<string, string[]>;

@Entity({ tableName: 'role' })
export class Role extends BaseEntity {
  @Property({ type: 'varchar', length: 30, unique: true })
  name!: SystemRoleName;

  @Property({ type: 'json' })
  permissions: RolePermissions = {};
}
