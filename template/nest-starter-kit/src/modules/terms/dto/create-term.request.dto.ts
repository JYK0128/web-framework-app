import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';

export class CreateTermRequestDto extends DtoType(Term) {
  @ApiProperty({ description: '약관 그룹 ID' })
  @IsString()
  @IsNotEmpty()
  termGroupId!: string;

  @ApiProperty({ example: 'v2.0.0', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  override version!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  override content!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  override publishedAt?: Date | null;
}
