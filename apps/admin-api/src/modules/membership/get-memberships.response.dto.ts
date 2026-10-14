import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { MembershipItemDto } from '#/modules/membership/membership-item.dto';

export class GetMembershipsResponseDto extends ListResponseDto<MembershipItemDto> {
  @ApiProperty({ type: [MembershipItemDto] })
  @Type(() => MembershipItemDto)
  override items!: MembershipItemDto[];
}
