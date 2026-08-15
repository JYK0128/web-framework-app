import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTermRequestDto {
  @ApiProperty({ description: '약관 그룹 ID' })
  @IsString()
  @IsNotEmpty()
  termGroupId!: string;

  @ApiProperty({ example: 'v2.0.0', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date | null;
}
