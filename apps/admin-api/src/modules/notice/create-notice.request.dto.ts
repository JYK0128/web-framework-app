import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { NoticeImportance } from '@pkg/shared/constants';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoticeRequestDto extends BaseDto {
  static readonly richTextFields = ['content'];
  @ApiProperty({ maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ enum: NoticeImportance }) @IsEnum(NoticeImportance) importance: NoticeImportance = NoticeImportance.NORMAL;
  @ApiProperty({ type: Boolean, default: false }) @IsBoolean() isPinned = false;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date | null;
}
