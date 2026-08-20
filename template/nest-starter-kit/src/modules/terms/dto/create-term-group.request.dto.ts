import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class CreateTermGroupRequestDto extends DtoType(TermGroup) {
  @ApiProperty({ type: 'string', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  override code!: string;

  @ApiProperty({ type: 'string', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  override title!: string;

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
