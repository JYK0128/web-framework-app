import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { ResourceItemDto } from './resource-item.dto';

export class GetResourcesResponseDto extends ListResponseDto<ResourceItemDto> {
  @ApiProperty({ type: () => [ResourceItemDto] })
  @Type(() => ResourceItemDto)
  override items!: ResourceItemDto[];
}
