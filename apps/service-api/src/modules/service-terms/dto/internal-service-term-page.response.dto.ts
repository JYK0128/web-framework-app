import { Type } from 'class-transformer';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { InternalServiceTermItemDto } from './internal-service-term-item.dto';

@ApiSchema({ name: 'InternalServiceTermPageResponse' })
export class InternalServiceTermPageResponseDto extends PageResponseDto<InternalServiceTermItemDto> {
  @ApiProperty({ type: [InternalServiceTermItemDto] }) @Type(() => InternalServiceTermItemDto) items!: InternalServiceTermItemDto[];
}
