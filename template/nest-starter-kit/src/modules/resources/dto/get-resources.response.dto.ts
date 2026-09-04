import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces';

import { ResourceDto } from './resource.dto';

export class GetResourcesResponseDto extends ListResponseDto<ResourceDto> {
  @ApiProperty({ type: () => [ResourceDto] })
  override items!: ResourceDto[];

  @ApiProperty({ type: () => [ResourceDto] })
  resources!: ResourceDto[];
}
