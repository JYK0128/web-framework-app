import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { MembershipPermissionItemDto } from '#/modules/memberships/dto/membership-permission-item.dto';

export class MembershipPermissionListResponseDto extends ListResponseDto<MembershipPermissionItemDto> { @ApiProperty({ type: [MembershipPermissionItemDto] }) @Type(() => MembershipPermissionItemDto) override items!: MembershipPermissionItemDto[]; }
