import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'CustomerItem' })
export class CustomerItemDto extends EntityDto(User) {
  @ApiProperty({ type: String })
  override id!: string;

  @ApiProperty({ type: String })
  override name!: string;

  @ApiProperty({ type: String })
  email!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  override image?: string | null;

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
