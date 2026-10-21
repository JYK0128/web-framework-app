import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsString } from 'class-validator';

export class CreateSupportMessageRequestDto extends BaseDto { @ApiProperty() @IsString() content!: string; }
