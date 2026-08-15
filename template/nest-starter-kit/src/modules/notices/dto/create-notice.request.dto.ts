import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { NOTICE_PRIORITIES } from '#/entities/notices/notice.entity';

export class CreateNoticeRequestDto {
  @ApiProperty({ example: '서비스 업데이트 안내', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: '새로운 기능이 추가되었습니다.' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ default: 0, enum: NOTICE_PRIORITIES })
  @IsOptional()
  @IsInt()
  @IsIn(NOTICE_PRIORITIES)
  @Min(0)
  @Max(2)
  priority?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date | null;
}
