import { ApiProperty } from '@nestjs/swagger';

export class FaqItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() category!: string;
  @ApiProperty() question!: string;
  @ApiProperty() answer!: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isPublished!: boolean;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
