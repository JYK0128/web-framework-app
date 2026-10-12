import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'PasswordResetRequestResponseDto' })
export class RequestPasswordResetResponseDto extends BaseDto { @ApiProperty() accepted!: boolean; }
