import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Notice, NOTICE_PRIORITIES, type NoticePriority } from '#/entities/notices/notice.entity';

export class CreateNoticeRequestDto extends DtoType(Notice) {
  @ApiProperty({ example: '서비스 업데이트 안내', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  override title!: string;

  @ApiProperty({ example: '새로운 기능이 추가되었습니다.' })
  @IsString()
  @IsNotEmpty()
  override content!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  override isPinned?: boolean;

  @ApiPropertyOptional({ default: 0, enum: NOTICE_PRIORITIES })
  @IsOptional()
  @IsInt()
  @IsIn(NOTICE_PRIORITIES)
  @Min(0)
  @Max(2)
  override priority?: NoticePriority;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  override publishedAt?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  override expiresAt?: Date | null;
}
