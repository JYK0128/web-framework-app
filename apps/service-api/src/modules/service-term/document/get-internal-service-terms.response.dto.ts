import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { InternalServiceTermItemDto } from '~/modules/service-term/document/internal-service-term-item.dto';

export class GetInternalServiceTermsResponseDto extends PageResponseDto<InternalServiceTermItemDto> {
  @ApiProperty({ type: [InternalServiceTermItemDto] })
  @Type(() => InternalServiceTermItemDto)
  items!: InternalServiceTermItemDto[];
}
