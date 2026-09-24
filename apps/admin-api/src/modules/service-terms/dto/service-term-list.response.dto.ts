import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { ServiceTermItemDto } from './service-term-item.dto';

export class ServiceTermListResponseDto extends PageResponseDto<ServiceTermItemDto> { @ApiProperty({ type: [ServiceTermItemDto] }) items!: ServiceTermItemDto[]; }
