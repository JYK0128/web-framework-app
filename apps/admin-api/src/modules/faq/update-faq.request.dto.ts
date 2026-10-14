import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, Max, Min, ValidateIf } from 'class-validator';

import { CreateFaqRequestDto } from '#/modules/faq/create-faq.request.dto';

export class UpdateFaqRequestDto extends PartialType(OmitType(CreateFaqRequestDto, ['sortOrder', 'isPublished'] as const), { skipNullProperties: false }) {
  @ApiPropertyOptional({ type: Number, minimum: 0, maximum: 999999 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt() @Min(0) @Max(999999)
  sortOrder?: number;

  @ApiPropertyOptional({ type: Boolean })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isPublished?: boolean;
}
