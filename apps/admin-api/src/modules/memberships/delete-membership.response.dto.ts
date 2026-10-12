import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class DeleteMembershipResponseDto extends BaseDto { @ApiProperty() id!: string; @ApiProperty() deleted!: boolean; }
