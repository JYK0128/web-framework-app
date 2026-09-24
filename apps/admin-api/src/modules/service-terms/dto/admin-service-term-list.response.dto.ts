import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { AdminServiceTermItemDto } from './admin-service-term-item.dto';

export class AdminServiceTermListResponseDto extends PageResponseDto<AdminServiceTermItemDto> { @ApiProperty({ type: [AdminServiceTermItemDto] }) items!: AdminServiceTermItemDto[]; }
