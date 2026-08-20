import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Faq } from '#/entities/faqs/faq.entity';

export class CreateFaqRequestDto extends DtoType(Faq) {
  @ApiProperty({ type: 'string', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  override category!: string;

  @ApiProperty({ type: 'string', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  override question!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override answer!: string;

  @ApiPropertyOptional({ type: 'number', default: 0 })
  @IsOptional()
  @IsInt()
  override order?: number;

  @ApiPropertyOptional({ type: 'boolean', default: true })
  @IsOptional()
  @IsBoolean()
  override isPublished?: boolean;
}
