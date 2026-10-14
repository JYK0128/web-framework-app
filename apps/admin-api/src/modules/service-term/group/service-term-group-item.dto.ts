import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

export class ServiceTermGroupItemDto extends BaseDto {
  @ApiProperty() id!: string;

  @ApiProperty() title!: string;

  @ApiProperty() isRequired!: boolean;

  @ApiProperty() sortOrder!: number;

  @ApiProperty({ format: 'date-time' }) createdAt!: Date;

  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
