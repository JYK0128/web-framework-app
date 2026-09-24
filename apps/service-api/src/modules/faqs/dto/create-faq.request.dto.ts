import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

import { FaqCategory } from '#/entities/faqs/faq.entity';

@ApiSchema({ name: 'CreateFaqRequest' })
export class CreateFaqRequestDto {
  @ApiProperty({ enum: FaqCategory }) @IsEnum(FaqCategory) category!: FaqCategory;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() question!: string;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() answer!: string;
  @ApiProperty({ type: Number, minimum: 0, maximum: 999999 }) @IsInt() @Min(0) @Max(999999) sortOrder = 0;
  @ApiProperty({ type: Boolean, default: true }) @IsBoolean() isPublished = true;
}
