import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';
import { BaseDto } from '#/common/interfaces/base/base.dto';

export class CreateOAuthIconPresignedUrlRequestDto {
  @ApiProperty({ example: 'google.png' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ enum: ['image/png', 'image/jpeg', 'image/webp'], example: 'image/png' })
  @IsString()
  @IsIn(['image/png', 'image/jpeg', 'image/webp'])
  contentType!: 'image/png' | 'image/jpeg' | 'image/webp';

  @ApiProperty({ example: 102400, maximum: SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes })
  @IsInt()
  @Min(1)
  @Max(SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes)
  fileSize!: number;
}

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
