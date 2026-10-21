import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class EventItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() content!: string;
  @ApiProperty({ format: 'date-time' }) startsAt!: Date;
  @ApiProperty({ format: 'date-time' }) endsAt!: Date;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty({ nullable: true }) linkUrl!: string | null;

  @ApiProperty({ type: Boolean }) isDraft!: boolean;
  @ApiProperty({ type: Boolean }) isScheduled!: boolean;
  @ApiProperty({ type: Boolean }) isPublished!: boolean;
  @ApiProperty({ enum: ['ongoing', 'upcoming', 'ended'] }) phase!: 'ongoing' | 'upcoming' | 'ended';
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
