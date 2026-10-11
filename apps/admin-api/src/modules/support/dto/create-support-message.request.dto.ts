import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class CreateSupportMessageRequestDto extends BaseDto { @ApiProperty() @IsString() content!: string; }
