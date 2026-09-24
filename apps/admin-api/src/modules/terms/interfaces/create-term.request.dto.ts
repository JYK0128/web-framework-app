import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTermRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  termGroupId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiProperty({ type: Boolean, description: '약관 고지 여부' })
  @IsBoolean()
  isNoticeRequired!: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: '게시 예정 시각 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
