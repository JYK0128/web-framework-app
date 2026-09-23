import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'AdminServiceTermItem' })
export class AdminServiceTermItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() groupId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: string;
  @ApiProperty() content!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isPublished!: boolean;
  @ApiProperty({ nullable: true, format: 'date-time' }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
