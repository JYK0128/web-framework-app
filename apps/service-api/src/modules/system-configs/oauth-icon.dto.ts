import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export const OAUTH_ICON_SUBDIR = 'oauth-icons';
export const OAUTH_ICON_MAX_SIZE = 2 * 1024 * 1024;

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
  @ApiProperty() uploadUrl!: string;
  @ApiProperty() fileUrl!: string;
  @ApiProperty() uploadId!: string;
  @ApiProperty() expiresInSeconds!: number;
}
