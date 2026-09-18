import { Collection, type Opt } from '@mikro-orm/core';
import { Entity, OneToMany, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

export const RoleCode = defineEnum('RoleCode', {
  SUPER_USER: 'super_user',
} as const);

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode] | (string & {});
export type RolePermissions = string[];

@Entity({ tableName: 'role' })
export class Role extends BaseEntity {
  @OneToMany(() => User, (user) => user.role)
  users = new Collection<User>(this);

  @Property({ type: 'string', length: 50, unique: true })
  code!: string;

  @Property({ type: 'string', length: 100, nullable: true })
  label: Opt<string> | null = null;

  @Property({ type: 'string', length: 255, nullable: true })
  description: Opt<string> | null = null;

  @Property({ type: 'boolean', default: false })
  isSystem: Opt<boolean> = false;

  @Property({ type: 'array', default: [] })
  permissions: Opt<string[]> = [];

  can(permission: string): boolean {
    const perms = this.permissions;
    if (!perms || perms.length === 0) return false;
    if (perms.includes('*')) return true;
    if (perms.includes(permission)) return true;

    const [resource] = permission.split(':');
    if (resource && perms.includes(`${resource}:*`)) return true;

    return false;
  }
}
