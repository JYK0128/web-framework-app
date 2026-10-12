import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { MembershipItemDto } from '#/modules/memberships/membership-item.dto';

export class MembershipListResponseDto extends ListResponseDto<MembershipItemDto> { @ApiProperty({ type: [MembershipItemDto] }) @Type(() => MembershipItemDto) override items!: MembershipItemDto[]; }
