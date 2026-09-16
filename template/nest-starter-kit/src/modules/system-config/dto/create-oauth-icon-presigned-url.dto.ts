import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

import { OAUTH_ICON_MAX_SIZE } from '#/modules/system-config/system-config.constants';

export class CreateOAuthIconPresignedUrlRequestDto {
  @ApiProperty({ description: '업로드할 원본 파일명', example: 'google.png' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({
    description: '파일의 MIME 타입 (image/png, image/jpeg, image/webp)',
    example: 'image/png',
    enum: ['image/png', 'image/jpeg', 'image/webp'],
  })
  @IsString()
  @IsIn(['image/png', 'image/jpeg', 'image/webp'])
  contentType!: 'image/png' | 'image/jpeg' | 'image/webp';

  @ApiProperty({
    description: '파일 크기 (바이트 단위, 최대 2MB)',
    example: 102400,
  })
  @IsInt()
  @Min(1)
  @Max(OAUTH_ICON_MAX_SIZE)
  fileSize!: number;
}

export class CreateOAuthIconPresignedUrlResponseDto {
  @ApiProperty({
    description: '스토리지에 직접 PUT 요청을 보낼 Presigned 업로드 URL',
    example: 'https://storage-bucket.s3.amazonaws.com/oauth-icons/...',
  })
  @IsString()
  uploadUrl!: string;

  @ApiProperty({
    description: '업로드 완료 후 최종 접근 가능한 파일 공개 URL',
    example: '/uploads/oauth-icons/2e5c4f74-0f93-4db5-8d73-6a2a9e8dfb28.png',
  })
  @IsString()
  fileUrl!: string;

  @ApiProperty({
    description: '생성된 업로드 파일 고유 식별자 (upload.id)',
    example: 'd9b2b512-38a1-4322-9907-e818b2de5d88',
  })
  @IsString()
  uploadId!: string;

  @ApiProperty({
    description: 'Presigned URL 유효 기간 (초)',
    example: 300,
  })
  @IsInt()
  expiresInSeconds!: number;
}
