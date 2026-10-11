import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class CreateOAuthIconPresignedUrlResponseDto extends BaseDto {
  @ApiProperty()
  @IsString()
  uploadUrl!: string;

  @ApiProperty()
  @IsString()
  fileUrl!: string;

  @ApiProperty()
  @IsString()
  uploadId!: string;

  @ApiProperty()
  @IsInt()
  expiresInSeconds!: number;
}
