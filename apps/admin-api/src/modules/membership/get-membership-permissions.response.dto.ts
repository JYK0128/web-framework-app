import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { MembershipPermissionItemDto } from '#/modules/membership/membership-permission-item.dto';

export class GetMembershipPermissionsResponseDto extends ListResponseDto<MembershipPermissionItemDto> {
  @ApiProperty({ type: [MembershipPermissionItemDto] })
  @Type(() => MembershipPermissionItemDto)
  override items!: MembershipPermissionItemDto[];
}
