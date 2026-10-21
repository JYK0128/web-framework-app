import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsInt, IsString } from 'class-validator';

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
