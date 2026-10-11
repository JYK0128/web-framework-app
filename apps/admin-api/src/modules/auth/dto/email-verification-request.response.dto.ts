import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class EmailVerificationRequestResponseDto extends BaseDto { @ApiProperty() accepted!: boolean; }
