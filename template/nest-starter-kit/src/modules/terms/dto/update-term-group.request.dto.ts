import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class UpdateTermGroupRequestDto extends DtoType(TermGroup) {
  @ApiPropertyOptional({ type: 'string', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  override code?: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override title?: string;

  @ApiPropertyOptional({ type: 'boolean', default: true })
  @IsOptional()
  @IsBoolean()
  override isRequired?: boolean;

  @ApiPropertyOptional({ type: 'number', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  override sortOrder?: number;
}
