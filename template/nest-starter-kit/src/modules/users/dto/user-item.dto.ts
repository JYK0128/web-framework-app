import { ApiProperty } from '@nestjs/swagger';
import type { ClassConstructor } from 'class-transformer';
import { isAfter } from 'date-fns';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { RoleKey } from '#/entities/auth.extensions/role.entity';
import { User } from '#/entities/auth/user.entity';

export class UserItemDto extends EntityDto(User) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override email!: string;

  @ApiProperty({ type: 'string' })
  override name!: string;

  @ApiEnum({ enum: RoleKey })
  role!: RoleKey;

  @ApiProperty({ type: 'boolean' })
  override twoFactorEnabled!: boolean;

  @ApiProperty({ type: 'boolean' })
  override banned!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  override banReason!: string | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override banExpires!: Date | null;

  @ApiProperty({ type: 'boolean' })
  deleted!: boolean;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override deletedAt!: Date | null;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;

  static from<T extends UserItemDto>(this: ClassConstructor<T>, user: User): T {
    return (this as unknown as typeof UserItemDto).fromPlain<T>({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.key ?? RoleKey.USER,
      twoFactorEnabled: user.twoFactorEnabled,
      banned: Boolean(user.banExpires && isAfter(user.banExpires, new Date())),
      banReason: user.banReason ?? null,
      banExpires: user.banExpires ?? null,
      deleted: Boolean(user.deletedAt),
      deletedAt: user.deletedAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
