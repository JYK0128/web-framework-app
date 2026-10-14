import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { ServiceTermGroupItemDto } from '#/modules/service-terms/groups/service-term-group-item.dto';

export class GetServiceTermGroupsResponseDto extends ListResponseDto<ServiceTermGroupItemDto> {
  @ApiProperty({ type: [ServiceTermGroupItemDto] }) @Type(() => ServiceTermGroupItemDto) override items!: ServiceTermGroupItemDto[];
}
