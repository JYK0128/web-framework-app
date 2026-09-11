import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { RoleKey, type RolePermissions } from '#/entities/auth.extensions/role.entity';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'UserProfileResponse' })
export class UserProfileResponseDto extends EntityDto(User) {
  @ApiProperty({ type: 'string', format: 'uuid' })
  override id!: string;

  @ApiProperty({ type: 'string', maxLength: 120 })
  override name!: string;

  @ApiProperty({ type: 'string', format: 'email' })
  override email!: string;

  @ApiProperty({ type: 'boolean' })
  override emailVerified!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  override phoneNumber!: string | null;

  @ApiProperty({ type: 'boolean' })
  override phoneNumberVerified!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  override image!: string | null;

  @ApiProperty({ type: 'boolean' })
  override twoFactorEnabled!: boolean;

  @ApiProperty({ type: 'boolean' })
  override banned!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  override banReason!: string | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override banExpires!: Date | null;

  @ApiEnum({ enum: RoleKey, nullable: true })
  role!: RoleKey | null;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  permissions!: RolePermissions;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  passwordUpdatedAt!: Date | null;

  @ApiProperty({ type: 'boolean' })
  isPasswordChangeRequired!: boolean;
}
