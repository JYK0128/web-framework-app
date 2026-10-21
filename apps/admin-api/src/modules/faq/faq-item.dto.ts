import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class FaqItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() category!: string;
  @ApiProperty() question!: string;
  @ApiProperty() answer!: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isPublished!: boolean;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
