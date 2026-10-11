import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { ServiceTermItemDto } from '#/modules/service-terms/dto/service-term-item.dto';

export class ServiceTermPageResponseDto extends PageResponseDto<ServiceTermItemDto> { @ApiProperty({ type: [ServiceTermItemDto] }) @Type(() => ServiceTermItemDto) items!: ServiceTermItemDto[]; }
