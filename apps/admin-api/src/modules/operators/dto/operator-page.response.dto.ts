import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { OperatorItemDto } from '#/modules/operators/dto/operator-item.dto';

@ApiSchema({ name: 'OperatorPageResponse' })
export class OperatorPageResponseDto extends PageResponseDto<OperatorItemDto> {
  @ApiProperty({ type: [OperatorItemDto] })
  @Type(() => OperatorItemDto) override items!: OperatorItemDto[];
}
