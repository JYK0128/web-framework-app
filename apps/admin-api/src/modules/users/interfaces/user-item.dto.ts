import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base';
import { User } from '#/entities/auth/user.entity';

export class UserItemDto extends BaseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ description: '할당된 역할 코드' })
  roleCode!: string;

  @ApiProperty()
  twoFactorEnabled!: boolean;

  @ApiProperty()
  banned!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  banReason!: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  banExpires!: Date | null;

  @ApiProperty()
  deleted!: boolean;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deletedAt!: Date | null;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;

  static from(user: User): UserItemDto {
    return UserItemDto.fromPlain({
      id: user.id,
      name: user.name,
      email: user.email,
      roleCode: user.role?.code ?? '',
      twoFactorEnabled: user.twoFactorEnabled,
      banned: user.isBanned,
      banReason: user.banReason ?? null,
      banExpires: user.banExpires ?? null,
      deleted: Boolean(user.deletedAt),
      deletedAt: user.deletedAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
