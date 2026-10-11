import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class PasswordResetRequestResponseDto extends BaseDto { @ApiProperty() accepted!: boolean; }
