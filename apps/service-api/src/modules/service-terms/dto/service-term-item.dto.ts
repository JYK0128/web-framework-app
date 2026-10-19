import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'ServiceTermItem' })
export class ServiceTermItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() groupId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: string;
  @ApiProperty() content!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) publishedAt!: Date;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
