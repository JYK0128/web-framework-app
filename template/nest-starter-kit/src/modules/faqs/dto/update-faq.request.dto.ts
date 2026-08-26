import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Faq } from '#/entities/faqs/faq.entity';

export class UpdateFaqRequestDto extends DtoType(Faq) {
  @ApiPropertyOptional({ type: 'string', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  override category?: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override question?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  override answer?: string;

  @ApiPropertyOptional({ type: 'number', default: 0 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  override order?: number;

  @ApiPropertyOptional({ type: 'boolean', default: true })
  @IsOptional()
  @IsBoolean()
  override isPublished?: boolean;
}
