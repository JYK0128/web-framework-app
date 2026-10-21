import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QnaPriority } from '@pkg/shared/constants';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { QnaCategory } from '~/core/database/entities/qna';

export class CreateQnaRequestDto {
  @ApiProperty({ enum: QnaCategory }) @IsEnum(QnaCategory) category!: QnaCategory;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
}
