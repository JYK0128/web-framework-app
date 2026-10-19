import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class CreateOAuthIconPresignedUrlRequestDto extends BaseDto {
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
