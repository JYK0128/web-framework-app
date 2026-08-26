import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { ToDate } from '#/common/decorators/to-date.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';

export class CreateTermRequestDto extends DtoType(Term) {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  termGroupId!: string;

  @ApiProperty({ type: 'string', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  override version!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override content!: string;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  @IsOptional()
  @ToDate()
  @IsDate()
  override publishedAt?: Date | null;
}
