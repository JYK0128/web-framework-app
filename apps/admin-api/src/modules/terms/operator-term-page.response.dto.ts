import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { OperatorTermItemDto } from '#/modules/terms/operator-term-item.dto';

export class OperatorTermPageResponseDto extends PageResponseDto<OperatorTermItemDto> {
  @ApiProperty({ type: [OperatorTermItemDto] })
  @Type(() => OperatorTermItemDto)
  override items!: OperatorTermItemDto[];
}
