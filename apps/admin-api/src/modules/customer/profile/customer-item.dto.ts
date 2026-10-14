import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base/entity.dto';

import { User } from '#/core/database/entities/auth';

@ApiSchema({ name: 'AdminCustomerItem' })
export class CustomerItemDto extends EntityDto(User) {
  @ApiProperty({ type: String })
  override id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  email!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  image?: string | null;

  @ApiProperty({ type: Boolean })
  override emailVerified!: boolean;

  @ApiProperty({ type: Boolean })
  override banned!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  override updatedAt!: Date;

  @ApiPropertyOptional({ type: String, nullable: true })
  roleCode?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  roleLabel?: string | null;
}
