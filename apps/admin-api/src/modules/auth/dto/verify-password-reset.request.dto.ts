import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'VerifyPasswordResetDto' })
export class VerifyPasswordResetRequestDto extends BaseDto { @ApiProperty() @IsString() @IsNotEmpty() challengeId!: string; @ApiProperty() @IsString() @IsNotEmpty() token!: string; }
