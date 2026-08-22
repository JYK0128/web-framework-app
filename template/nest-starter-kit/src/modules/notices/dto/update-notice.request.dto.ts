import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Notice, NoticePriority } from '#/entities/notices/notice.entity';

export class UpdateNoticeRequestDto extends DtoType(Notice) {
  @ApiPropertyOptional({ type: 'string', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override title?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  override content?: string;

  @ApiEnumOptional({ default: 0, enum: NoticePriority })
  @IsOptional()
  @IsEnum(NoticePriority)
  override priority?: NoticePriority;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  override publishedAt?: Date | null;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  override expiresAt?: Date | null;
}
