import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

@ApiSchema({ name: 'AdminCustomerItem' })
export class CustomerItemDto extends BaseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  email!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  image?: string | null;

  @ApiProperty({ type: Boolean })
  emailVerified!: boolean;

  @ApiProperty({ type: Boolean })
  banned!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: String, nullable: true })
  roleCode?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  roleLabel?: string | null;
}
