import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { InternalServiceTermGroupItemDto } from '~/modules/service-term/group/internal-service-term-group-item.dto';

export class GetInternalServiceTermGroupsResponseDto extends ListResponseDto<InternalServiceTermGroupItemDto> {
  @ApiProperty({ type: [InternalServiceTermGroupItemDto] })
  @Type(() => InternalServiceTermGroupItemDto)
  override items!: InternalServiceTermGroupItemDto[];
}
