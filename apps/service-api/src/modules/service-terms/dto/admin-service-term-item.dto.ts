import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'AdminServiceTermItem' })
export class AdminServiceTermItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() groupId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: string;
  @ApiProperty() content!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() summary!: string;
  @ApiProperty({ type: Boolean, description: '약관 고지 여부' }) isNoticeRequired!: boolean;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isPublished!: boolean;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
