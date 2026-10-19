import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { NoticeImportance } from '@pkg/shared/constants';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

@ApiSchema({ name: 'CreateNoticeRequest' })
export class CreateNoticeRequestDto {
  static readonly richTextFields = ['content'];
  @ApiProperty({ type: String, maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ enum: NoticeImportance, default: NoticeImportance.NORMAL }) @IsEnum(NoticeImportance) importance = NoticeImportance.NORMAL;
  @ApiProperty({ type: Boolean, default: false }) @IsBoolean() isPinned = false;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date | null;
}
