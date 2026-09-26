import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

import { OAUTH_ICON_MAX_SIZE } from '#/modules/system-configs/system-config.constants';

export class CreateOAuthIconPresignedUrlRequestDto {
  @ApiProperty({ example: 'google.png' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ enum: ['image/png', 'image/jpeg', 'image/webp'], example: 'image/png' })
  @IsString()
  @IsIn(['image/png', 'image/jpeg', 'image/webp'])
  contentType!: 'image/png' | 'image/jpeg' | 'image/webp';

  @ApiProperty({ example: 102400, maximum: OAUTH_ICON_MAX_SIZE })
  @IsInt()
  @Min(1)
  @Max(OAUTH_ICON_MAX_SIZE)
  fileSize!: number;
}

export class CreateOAuthIconPresignedUrlResponseDto {
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
