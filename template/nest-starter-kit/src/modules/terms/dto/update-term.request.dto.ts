import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

import { ToDate } from '#/common/decorators/to-date.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';

export class UpdateTermRequestDto extends DtoType(Term) {
  @ApiPropertyOptional({ type: 'string', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  @IsOptional()
  @ToDate()
  @IsDate()
  publishedAt?: Date | null;
}
